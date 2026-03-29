from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class GoalInput(BaseModel):
    name: str
    target_amount: float = Field(..., ge=0)
    timeline_months: int = Field(..., gt=0)


class UserProfileInput(BaseModel):
    name: str
    age: int = Field(..., ge=18, le=70)
    city: str
    monthly_salary: float = Field(..., ge=0)
    monthly_side_income: float = Field(0, ge=0)
    expected_salary_growth_rate: float = Field(8, ge=0, le=100)
    fixed_expenses: float = Field(..., ge=0)
    variable_expenses: float = Field(..., ge=0)
    annual_expenses: float = Field(0, ge=0)
    emergency_savings: float = Field(0, ge=0)
    existing_investments: float = Field(0, ge=0)
    outstanding_debt: float = Field(0, ge=0)
    annual_debt_payment: float = Field(0, ge=0)
    term_insurance_cover: float = Field(0, ge=0)
    health_insurance_cover: float = Field(0, ge=0)
    tax_saving_80c: float = Field(0, ge=0)
    tax_saving_80d: float = Field(0, ge=0)
    nps_investment: float = Field(0, ge=0)
    retirement_age: int = Field(..., gt=30, le=75)
    goals: List[GoalInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_retirement_window(self) -> "UserProfileInput":
        if self.retirement_age <= self.age:
            raise ValueError("retirement_age must be greater than age")
        return self


class ScoreBreakdown(BaseModel):
    emergency_fund: int
    insurance: int
    investments: int
    debt: int
    tax_planning: int
    retirement: int


class MoneyHealthResponse(BaseModel):
    total_score: int
    grade: str
    breakdown: ScoreBreakdown
    insights: List[str]
    top_actions: List[str]


class FireRoadmapResponse(BaseModel):
    roadmap: dict
    model_used: str
    fallback_used: bool
    notes: Optional[str] = None
