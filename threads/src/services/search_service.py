from elasticsearch import AsyncElasticsearch
from src.core.config import settings

class SearchService:
    def __init__(self):
        self.client = AsyncElasticsearch(
            settings.ELASTICSEARCH_URL
        )

    async def create_index(self):
        import asyncio
        for i in range(10):
            try:
                index_exists = await self.client.indices.exists(index=settings.ELSEARCH_INDEX if hasattr(settings, "ELSEARCH_INDEX") else settings.ELASTICSEARCH_INDEX)
                if not index_exists:
                    await self.client.indices.create(
                        index=settings.ELSEARCH_INDEX if hasattr(settings, "ELSEARCH_INDEX") else settings.ELASTICSEARCH_INDEX,
                        body={
                            "mappings": {
                                "properties": {
                                    "title": {"type": "text"},
                                    "description": {"type": "text"},
                                    "category": {"type": "keyword"},
                                    "author_id": {"type": "keyword"},
                                    "vote_count": {"type": "integer"},
                                    "status": {"type": "keyword"},
                                    "created_at": {"type": "date"}
                                }
                            }
                        }
                    )
                return
            except Exception as e:
                print(f"Waiting for Elasticsearch... ({e})")
                await asyncio.sleep(3)
        raise Exception("Could not connect to Elasticsearch after multiple retries")

    async def index_idea(self, idea_id: str, data: dict):
        await self.client.index(
            index=settings.ELASTICSEARCH_INDEX,
            id=idea_id,
            document=data,
            refresh=True
        )

    async def search_ideas(self, query_text: str = None, category: str = None, sort: str = "new", page: int = 1, size: int = 10):
        query = {"bool": {"must": [], "filter": []}}
        
        # Only show APPROVED or PENDING_MODERATION
        query["bool"]["filter"].append({
            "terms": {"status": ["APPROVED", "PENDING_MODERATION"]}
        })

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
        return resp['hits']['hits'], resp['hits']['total']['value']

    async def close(self):
        await self.client.close()

search_service = SearchService()
