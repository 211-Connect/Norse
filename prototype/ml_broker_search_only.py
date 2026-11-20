# Local prototype runner: ml-broker with only the search-classification route (no spaCy, no Mongo).
# Run from the MlBrokerWorktree-search root: uv run uvicorn --app-dir <scratchpad> search_only_app:app --port 8010
import sys
from contextlib import asynccontextmanager
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))

from fastapi import FastAPI  # noqa: E402

from src.config import Settings  # noqa: E402
from src.model_registry.manifest import load_manifest  # noqa: E402
from src.model_registry.service import ModelRegistry  # noqa: E402
from src.tasks.search_classification.router import router  # noqa: E402
from src.tasks.search_classification.service import SearchClassificationService  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    registry = ModelRegistry(load_manifest(settings.model_manifest_path))
    service = SearchClassificationService(registry=registry, model_storage_root=settings.model_storage_root)
    await service.start()
    app.state.settings = settings
    app.state.search_classification_service = service
    print("search-only ready:", service.is_ready(), flush=True)
    yield
    await service.stop()


app = FastAPI(lifespan=lifespan)
app.include_router(router)
