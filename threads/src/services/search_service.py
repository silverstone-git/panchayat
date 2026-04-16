from elasticsearch import AsyncElasticsearch
from src.core.config import settings

class SearchService:
    def __init__(self):
        self.client = AsyncElasticsearch(
            settings.ELASTICSEARCH_URL,
            basic_auth=(settings.ELASTIC_USER, settings.ELASTIC_PASSWORD),
            verify_certs=False  # Disabled for local development with self-signed certs
        )

    async def create_index(self):
        index_exists = await self.client.indices.exists(index=settings.ELASTICSEARCH_INDEX)
        if not index_exists:
            await self.client.indices.create(
                index=settings.ELASTICSEARCH_INDEX,
                body={
                    "mappings": {
                        "properties": {
                            "title": {"type": "text"},
                            "description": {"type": "text"},
                            "category": {"type": "keyword"},
                            "author_id": {"type": "keyword"},
                            "vote_count": {"type": "integer"},
                            "created_at": {"type": "date"}
                        }
                    }
                }
            )

    async def index_idea(self, idea_id: str, data: dict):
        await self.client.index(
            index=settings.ELASTICSEARCH_INDEX,
            id=idea_id,
            document=data
        )

    async def search_ideas(self, query_text: str = None, category: str = None, sort: str = "new", page: int = 1, size: int = 10):
        query = {"bool": {"must": []}}
        
        if query_text:
            query["bool"]["must"].append({
                "multi_match": {
                    "query": query_text,
                    "fields": ["title", "description"]
                }
            })
        
        if category:
            query["bool"]["must"].append({"term": {"category": category}})

        sort_criteria = []
        if sort == "trending":
            sort_criteria.append({"vote_count": "desc"})
        else:
            sort_criteria.append({"created_at": "desc"})

        resp = await self.client.search(
            index=settings.ELASTICSEARCH_INDEX,
            query=query,
            sort=sort_criteria,
            from_=(page - 1) * size,
            size=size
        )
        return resp['hits']['hits']

    async def close(self):
        await self.client.close()

search_service = SearchService()
