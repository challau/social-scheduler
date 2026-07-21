import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import User, Plan, Subscription, Payment, AIGeneration
from ..api.auth import get_current_user
from ..config import settings

# Attempt dynamic Stripe import
try:
    import stripe
except ImportError:
    stripe = None

router = APIRouter(prefix="/billing", tags=["billing"])

class PlanResponse(BaseModel):
    id: int
    name: str
    ai_limit: int
    price_monthly: int

class BillingStatusResponse(BaseModel):
    plan_name: str
    ai_generations_used: int
    ai_generations_limit: int
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime.datetime] = None

class SubscribeRequest(BaseModel):
    plan_id: int
    success_url: str
    cancel_url: str


# Seeder helper to ensure plans exist in the DB
def _seed_plans_if_needed(db: Session):
    free_plan = db.query(Plan).filter(Plan.name == "free").first()
    if not free_plan:
        free_plan = Plan(name="free", ai_limit=10, price_monthly=0)
        db.add(free_plan)

    pro_plan = db.query(Plan).filter(Plan.name == "pro").first()
    if not pro_plan:
        pro_plan = Plan(name="pro", ai_limit=999999, price_monthly=2900) # $29.00
        db.add(pro_plan)
    db.commit()


@router.get("/plans", response_model=List[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    """Returns list of subscription plans"""
    _seed_plans_if_needed(db)
    plans = db.query(Plan).all()
    return plans


@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns active subscription state and generation consumption stats for the current billing cycle"""
    _seed_plans_if_needed(db)
    
    # 1. Fetch current active subscription
    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active"
    ).first()
    
    active_plan = db.query(Plan).filter(Plan.name == "free").first()
    sub_status = None
    period_end = None
    
    if sub:
        active_plan = sub.plan
        sub_status = sub.status
        period_end = sub.current_period_end

    # 2. Count AI generations in current calendar month
    now = datetime.datetime.utcnow()
    start_of_month = datetime.datetime(now.year, now.month, 1)
    
    ai_generations_count = db.query(AIGeneration).join(AIGeneration.post).filter(
        AIGeneration.post.has(user_id=current_user.id),
        AIGeneration.created_at >= start_of_month
    ).count()

    return {
        "plan_name": active_plan.name,
        "ai_generations_used": ai_generations_count,
        "ai_generations_limit": active_plan.ai_limit,
        "subscription_status": sub_status,
        "current_period_end": period_end
    }


@router.post("/subscribe", response_model=dict)
def subscribe_to_plan(
    req: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates Stripe checkout session to purchase Pro plan.
    Falls back to mock redirect when Stripe is not configured/installed.
    """
    _seed_plans_if_needed(db)
    target_plan = db.query(Plan).filter(Plan.id == req.plan_id).first()
    if not target_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if target_plan.name == "free":
        # Cannot buy free plan; user defaults to free
        raise HTTPException(status_code=400, detail="Cannot purchase Free plan")

    # Real Stripe integration if Stripe package is installed and keys are set
    if stripe and settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            # Simple mock price mapping (use configuration or stripe price identifier)
            price_id = settings.STRIPE_PRO_PRICE_ID
            
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=req.success_url + "?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=req.cancel_url,
                client_reference_id=str(current_user.id),
                customer_email=current_user.email
            )
            return {
                "checkout_url": checkout_session.url,
                "is_mock": False
            }
        except Exception as e:
            # Fall back to simulated payment process on error
            print(f"[Billing Error] Stripe session creation failed: {e}")

    # Fallback/Mock subscription execution (sets up user subscription directly for sandbox)
    mock_url = f"{req.success_url}?mock_success=true&user_id={current_user.id}&plan_id={req.plan_id}"
    return {
        "checkout_url": mock_url,
        "is_mock": True
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhooks listener. Also parses custom mock confirmations from mock checkout redirect page.
    """
    # 1. Handle mock direct upgrades
    qp = dict(request.query_params)
    if qp.get("mock_success") == "true" and qp.get("user_id") and qp.get("plan_id"):
        user_id = int(qp["user_id"])
        plan_id = int(qp["plan_id"])
        
        # Upsert subscription
        existing = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if existing:
            existing.plan_id = plan_id
            existing.status = "active"
            existing.current_period_end = datetime.datetime.utcnow() + datetime.timedelta(days=30)
        else:
            sub = Subscription(
                user_id=user_id,
                plan_id=plan_id,
                status="active",
                stripe_subscription_id="mock_sub_id_" + str(int(datetime.datetime.utcnow().timestamp())),
                current_period_end=datetime.datetime.utcnow() + datetime.timedelta(days=30)
            )
            db.add(sub)
        
        payment = Payment(
            user_id=user_id,
            stripe_payment_id="mock_pay_id_" + str(int(datetime.datetime.utcnow().timestamp())),
            amount=2900,
            status="succeeded"
        )
        db.add(payment)
        db.commit()
        return {"status": "success", "detail": "Mock subscription activated successfully"}

    # 2. Real Stripe Webhook verification
    if not stripe or not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Stripe webhook endpoint is not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {e}")

    # Handle subscription creation / updates
    if event['type'] in ['checkout.session.completed', 'invoice.payment_succeeded']:
        session = event['data']['object']
        client_ref_id = session.get('client_reference_id')
        customer_email = session.get('customer_email')
        
        user = None
        if client_ref_id:
            user = db.query(User).filter(User.id == int(client_ref_id)).first()
        elif customer_email:
            user = db.query(User).filter(User.email == customer_email).first()

        if user:
            pro_plan = db.query(Plan).filter(Plan.name == "pro").first()
            if pro_plan:
                # Upsert Subscription record
                existing = db.query(Subscription).filter(Subscription.user_id == user.id).first()
                if existing:
                    existing.plan_id = pro_plan.id
                    existing.status = "active"
                    existing.current_period_end = datetime.datetime.utcnow() + datetime.timedelta(days=30)
                else:
                    sub = Subscription(
                        user_id=user.id,
                        plan_id=pro_plan.id,
                        status="active",
                        stripe_subscription_id=session.get('subscription'),
                        current_period_end=datetime.datetime.utcnow() + datetime.timedelta(days=30)
                    )
                    db.add(sub)
                
                # Register payment record
                amt = session.get('amount_total', 2900)
                pay = Payment(
                    user_id=user.id,
                    stripe_payment_id=session.get('payment_intent') or session.get('id', 'pay_unknown'),
                    amount=amt,
                    status="succeeded"
                )
                db.add(pay)
                db.commit()

    return {"status": "success"}
