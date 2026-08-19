"""HTTP API for VANTA's existing recommendation engine."""

from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.recommender import get_movie_details, get_trending_movies, movies_df, recommend_movies


app = FastAPI(title="VANTA API")

# The landing page can be served by a lightweight local static server during
# development, separately from this API process.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    """Return welcome message for API root."""
    return {
        "name": "VANTA AI Recommendation API",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Return a simple service-health response."""
    return {"status": "ok"}


@app.get("/movies/trending")
def trending_movies(limit: int = Query(default=10, ge=1, le=20)) -> dict[str, Any]:
    """Return top trending catalog movies."""
    return get_trending_movies(limit)


@app.get("/movies/random")
def random_movies(limit: int = Query(default=3, ge=1, le=12)) -> dict[str, list[str]]:
    """Return distinct, real titles from the recommendation catalog."""
    titles = movies_df["primaryTitle"].dropna().drop_duplicates()
    sample_size = min(limit, len(titles))
    picks = titles.sample(n=sample_size, replace=False, random_state=None)
    return {"movies": picks.tolist()}


@app.get("/movies/search")
def search_movies(
    query: str = Query(min_length=1),
    limit: int = Query(default=6, ge=1, le=10),
) -> dict[str, list[str]]:
    """Find catalog titles for search-box autocomplete."""
    normalized_query = query.strip()
    if not normalized_query:
        return {"movies": []}

    titles = movies_df["primaryTitle"].dropna().drop_duplicates()
    matches = titles[titles.str.contains(normalized_query, case=False, regex=False)]
    starts_with_query = matches[matches.str.startswith(normalized_query, na=False)]
    ordered_matches = np.concatenate((starts_with_query.to_numpy(), matches[~matches.isin(starts_with_query)].to_numpy()))
    return {"movies": ordered_matches[:limit].tolist()}


@app.get("/movie/details")
def movie_details(
    title: str = Query(min_length=1),
) -> Any:
    """Return detailed metadata for a single film."""
    result = get_movie_details(title)
    if not result["found"]:
        return JSONResponse(status_code=404, content=jsonable_encoder(result))
    return result


@app.get("/recommend")
def recommend(
    movie: str | None = Query(default=None),
    limit: int = Query(default=10, ge=1),
) -> Any:
    """Return recommendations from the existing hybrid recommender."""
    if movie is None:
        raise HTTPException(status_code=400, detail="The 'movie' parameter is required.")
    if not movie.strip():
        raise HTTPException(status_code=400, detail="The 'movie' parameter cannot be empty.")

    result = recommend_movies(movie, limit)
    if not result["found"]:
        return JSONResponse(status_code=404, content=jsonable_encoder(result))

    return result


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)

