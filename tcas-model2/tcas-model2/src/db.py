from sqlalchemy import create_engine

# 🔐 Your PostgreSQL connection details
DATABASE_URL = "postgresql://se_admin:password@localhost:5433/project_se"

# 🔌 Create connection engine
engine = create_engine(DATABASE_URL)
