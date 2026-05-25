from upstash_redis import Redis
from app.core.config import settings
# Cách này mới cần dùng đến URL và Token
redis_client = Redis(
    url=settings.UPSTASH_REDIS_REST_URL,
    token=settings.UPSTASH_REDIS_REST_TOKEN
)

# Lưu ý: Thư viện này mặc định hỗ trợ cả đồng bộ và bất đồng bộ (async) trực tiếp