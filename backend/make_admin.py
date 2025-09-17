#!/usr/bin/env python3
"""
Script to make a user admin by email address.

Usage:
    python make_admin.py user@example.com
"""

import sys
import os

# Add the current directory to Python path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User, UserRole


def make_user_admin(email: str):
    """Make a user admin by their email address."""
    
    db = SessionLocal()
    try:
        # Find the user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email '{email}' not found!")
            return False
        
        # Check if already admin
        if user.role == UserRole.ADMIN:
            print(f"✅ User '{email}' is already an admin!")
            return True
        
        # Update role to admin
        user.role = UserRole.ADMIN
        db.commit()
        
        print(f"✅ Successfully made user '{email}' an admin!")
        print(f"   User ID: {user.id}")
        print(f"   Name: {user.full_name or 'Not set'}")
        print(f"   Role: {user.role}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error making user admin: {e}")
        return False
        
    finally:
        db.close()


def list_all_users():
    """List all users in the database."""
    
    db = SessionLocal()
    try:
        users = db.query(User).all()
        
        if not users:
            print("No users found in the database.")
            return
        
        print(f"\n📋 Found {len(users)} users:")
        print("-" * 80)
        
        for user in users:
            name = user.full_name or "Not set"
            print(f"Email: {user.email}")
            print(f"Name: {name}")
            print(f"Role: {user.role}")
            print(f"Active: {user.is_active}")
            print(f"Created: {user.created_at}")
            print("-" * 40)
            
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        
    finally:
        db.close()


def main():
    """Main function."""
    
    if len(sys.argv) < 2:
        print("📋 Usage:")
        print("  python make_admin.py <email>          - Make user admin")
        print("  python make_admin.py --list           - List all users")
        print("  python make_admin.py --help           - Show this help")
        print()
        print("Examples:")
        print("  python make_admin.py user@example.com")
        print("  python make_admin.py --list")
        return
    
    action = sys.argv[1]
    
    if action == "--help":
        main()
        return
    elif action == "--list":
        list_all_users()
        return
    else:
        # Treat as email address
        email = action
        success = make_user_admin(email)
        
        if success:
            print("\n🎉 Done! The user can now access admin features.")
        else:
            print("\n❌ Failed to make user admin.")
            sys.exit(1)


if __name__ == "__main__":
    main()
