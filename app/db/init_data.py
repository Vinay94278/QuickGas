from app.db.session import SessionLocal
from app.models import Company, Gas, Role, User, OrderStatus
from app.core.security import get_password_hash

def init_data():
    db = SessionLocal()
    try:
        # # Insert Roles
        # roles = [
        #     Role(name="ADMIN", description="System administrator with full access"),
        #     Role(name="DISPATCHER", description="Manages order dispatch and delivery"),
        #     Role(name="DRIVER", description="Responsible for delivering orders"),
        #     Role(name="CUSTOMER", description="Company representatives who place orders"),
        # ]
        # db.add_all(roles)
        
        # # Insert Order Statuses
        # order_statuses = [
        #     OrderStatus(name="PENDING", description="Order received and awaiting processing"),
        #     OrderStatus(name="OUT_FOR_DELIVERY", description="Order is on the way to customer"),
        #     OrderStatus(name="COMPLETED", description="Order successfully delivered"),
        #     OrderStatus(name="OVERDUE", description="Order was not delivered within the expected time"),
        #     OrderStatus(name="DELETED", description="Order record removed from the system"),
        #     OrderStatus(name="CANCELLED", description="Order was cancelled"),
        # ]
        # db.add_all(order_statuses)
        
        # # Insert Company
        # company = Company(
        #     name="Hare Krishna Gas Agency",
        #     address="Udhna Darwaja, opp. Parag, Maan Darwaja, Aman Nagar, Surat, Gujarat 395002"
        # )
        # db.add(company)
        
        # # Insert Gases
        # gases = [
        #     Gas(name="Oxygen", unit="Cubic Meters", description="Medical Grade Oxygen"),
        #     Gas(name="Nitrogen", unit="Cubic Meters", description="Industrial Nitrogen"),
        #     Gas(name="Carbon Dioxide", unit="Cubic Meters", description="Food Grade CO2"),
        #     Gas(name="Argon", unit="Cubic Meters", description="Welding Grade Argon"),
        #     Gas(name="Helium", unit="Cubic Meters", description="Balloon Grade Helium"),
        # ]
        # db.add_all(gases)
        
        # db.commit()
        
        # # Insert Admin User
        # admin_user = User(
        #     name="Gaurav Vasani",
        #     phone="+91-9876543210",
        #     email="admin@harekrishnagas.com",
        #     address="Udhna Darwaja, opp. Parag, Maan Darwaja, Aman Nagar, Surat, Gujarat 395002",
        #     company_id=1,
        #     role_id=1,
        #     password_hash=get_password_hash("password")
        # )
        # db.add(admin_user)

        admin_user_2 = User(
            name="Chirag Vasani",
            phone="+91-7517075171",
            email="chirag.vasani@quickgas.com",
            address="51, Shree, 3, road, beside SR rooms, Gangeswar nagar, Ichchhapor, Hazira, Surat, Gujarat 394510",
            company_id=3,
            role_id=1,
            password_hash=get_password_hash("admin@qg02")
        )
        db.add(admin_user_2)

        admin_user_3 = User(
            name="Jigar Vasani",
            phone="+91-9375755430",
            email="jigar.vasani@quickgas.com",
            address="Udhna Darwaja, opp. Parag, Maan Darwaja, Aman Nagar, Surat, Gujarat 395002",
            company_id=2,
            role_id=1,
            password_hash=get_password_hash("Admin@qg01")
        )
        db.add(admin_user_3)
        
        db.commit()
        
        print("✅ Sample data inserted successfully!")
        # print(f"👤 Admin User: admin@harekrishnagas.com / password")
        # print(f"🏢 Company: Hare Krishna Gas Agency")
        # print(f"🧪 Gases: {', '.join([gas.name for gas in gases])}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error inserting sample data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_data()