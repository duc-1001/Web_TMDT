import sys
import hashlib

# Ensure utf-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def get_hash(password: str) -> str:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
        return pwd_context.hash(sha)
    except ImportError:
        import bcrypt
        sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(sha.encode("utf-8"), salt).decode("utf-8")

if __name__ == "__main__":
    password = sys.argv[1] if len(sys.argv) > 1 else "admin1234@"
    hashed = get_hash(password)
    print("=" * 60)
    print(f"Password     : {password}")
    print(f"Hashed (DB)  : {hashed}")
    print("=" * 60)
