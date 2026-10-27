import sys
import os

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.seed_data import seed_database

if __name__ == "__main__":
    print("Resetting and generating AICTE Complaint Intelligence Hub synthetic dataset...")
    seed_database(reset=True)
    print("AICTE CIH database reset complete.")
