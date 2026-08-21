import sys
from sqlalchemy import func
from server.database import SessionLocal
from server.models import Contribution, Sponsorship, Expense

def run_tests():
    db = SessionLocal()
    try:
        print("Starting financial calculation validation tests for 2026...")
        
        # 1. Total Paid Contributions
        total_contributions = db.query(func.sum(Contribution.amount)).filter(
            Contribution.status == "PAID",
            Contribution.member_id != None,
            func.extract('year', Contribution.date) == 2026
        ).scalar() or 0.0
        total_contributions = float(total_contributions)
        print(f"Calculated Total Paid Member Contributions (2026): Rs. {total_contributions:,.2f}")
        assert total_contributions == 6000.00, f"Expected 6,000.00, got {total_contributions}"

        # 2. Total Paid Sponsorships
        total_sponsorships = db.query(func.sum(Sponsorship.amount)).filter(
            Sponsorship.status == "PAID",
            func.extract('year', Sponsorship.date) == 2026
        ).scalar() or 0.0
        total_sponsorships = float(total_sponsorships)
        print(f"Calculated Total Paid Sponsorships (2026): Rs. {total_sponsorships:,.2f}")
        assert total_sponsorships == 0.00, f"Expected 0.00, got {total_sponsorships}"

        # 3. Total Public Donations (Chandhalu)
        total_chandhalu = db.query(func.sum(Contribution.amount)).filter(
            Contribution.status == "PAID",
            Contribution.member_id == None,
            func.extract('year', Contribution.date) == 2026
        ).scalar() or 0.0
        total_chandhalu = float(total_chandhalu)
        print(f"Calculated Total Public Donations (Chandhalu) (2026): Rs. {total_chandhalu:,.2f}")
        assert total_chandhalu == 0.00, f"Expected 0.00, got {total_chandhalu}"
        
        # 4. Total Funds (Contributions + Sponsorships + Chandhalu)
        total_funds = total_contributions + total_sponsorships + total_chandhalu
        print(f"Calculated Total Funds (Contributions + Sponsorships + Chandhalu) (2026): Rs. {total_funds:,.2f}")
        assert total_funds == 6000.00, f"Expected 6,000.00, got {total_funds}"

        # 5. Total Expenses
        total_expenses = db.query(func.sum(Expense.amount)).filter(
            func.extract('year', Expense.date) == 2026
        ).scalar() or 0.0
        total_expenses = float(total_expenses)
        print(f"Calculated Total Expenses (2026): Rs. {total_expenses:,.2f}")
        assert total_expenses == 0.00, f"Expected 0.00, got {total_expenses}"

        # 6. Current Balance (Total Funds - Total Expenses)
        current_balance = total_funds - total_expenses
        print(f"Calculated Current Balance (2026): Rs. {current_balance:,.2f}")
        assert current_balance == 6000.00, f"Expected 6,000.00, got {current_balance}"

        print("\nSUCCESS: All financial calculations are mathematically accurate!")
        sys.exit(0)
        
    except AssertionError as ae:
        print(f"\nFAILURE: Calculation mismatch! {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR running calculations test: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
