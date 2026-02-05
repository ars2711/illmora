import asyncio
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.sql_models import KnowledgeNode, KnowledgeEdge, EdgeType, Base

# NOTE: In a real environment, we would use the AsyncSession or just the normal sync session
# For scripting, sync is often easier.

def seed_data():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    print("Checking if graph is empty...")
    existing = db.query(KnowledgeNode).first()
    if existing:
        print("Graph already has data. Skipping seed.")
        return

    print("Seeding Knowledge Graph: Python 101...")

    # -- NODES --
    # For now, we use dummy embeddings (0.001) just to satisfy the constraint
    dummy_embedding = [0.001] * 1536

    nodes = [
        # Programming Basics
        KnowledgeNode(
            id=str(uuid.uuid4()),
            slug="variables",
            name="Variables",
            definition="Containers for storing data values.",
            domain="Computer Science",
            embedding=dummy_embedding
        ),
        KnowledgeNode(
            id=str(uuid.uuid4()),
            slug="data-types",
            name="Data Types",
            definition="An attribute of data which tells the compiler or interpreter how the programmer intends to use the data.",
            domain="Computer Science",
            embedding=dummy_embedding
        ),
        KnowledgeNode(
            id=str(uuid.uuid4()),
            slug="control-flow",
            name="Control Flow",
            definition="The order in which individual statements, instructions or function calls of an imperative program are executed or evaluated.",
            domain="Computer Science",
            embedding=dummy_embedding
        ),
        KnowledgeNode(
            id=str(uuid.uuid4()),
            slug="loops",
            name="Loops",
            definition="A sequence of instruction s that is continually repeated until a certain condition is reached.",
            domain="Computer Science",
            embedding=dummy_embedding
        ),
        KnowledgeNode(
            id=str(uuid.uuid4()),
            slug="functions",
            name="Functions",
            definition="A block of code which only runs when it is called.",
            domain="Computer Science",
            embedding=dummy_embedding
        ),
        KnowledgeNode(
            id=str(uuid.uuid4()),
            slug="recursion",
            name="Recursion",
            definition="A process in which a function calls itself as a subroutine.",
            domain="Computer Science",
            difficulty_level=5,
            embedding=dummy_embedding
        ),
    ]

    db.add_all(nodes)
    db.commit()

    # Map slugs to IDs for easier edge creation
    node_map = {n.slug: n.id for n in nodes}

    # -- EDGES --
    edges = [
        KnowledgeEdge(
            source_node_id=node_map["variables"],
            target_node_id=node_map["data-types"],
            relation_type=EdgeType.RELATED
        ),
        KnowledgeEdge(
            source_node_id=node_map["variables"],
            target_node_id=node_map["control-flow"],
            relation_type=EdgeType.PREREQUISITE
        ),
        KnowledgeEdge(
            source_node_id=node_map["control-flow"],
            target_node_id=node_map["loops"],
            relation_type=EdgeType.PREREQUISITE
        ),
        KnowledgeEdge(
            source_node_id=node_map["loops"],
            target_node_id=node_map["recursion"],
            relation_type=EdgeType.PREREQUISITE # Usually helpful to know loops first
        ),
        KnowledgeEdge(
            source_node_id=node_map["functions"],
            target_node_id=node_map["recursion"],
            relation_type=EdgeType.PREREQUISITE # Must know functions to understand recursion
        ),
        KnowledgeEdge(
            source_node_id=node_map["loops"],
            target_node_id=node_map["recursion"],
            relation_type=EdgeType.COMMON_CONFUSION # Students confuse iteration vs recursion
        ),
    ]

    db.add_all(edges)
    db.commit()
    print("Seeding complete!")

if __name__ == "__main__":
    seed_data()
