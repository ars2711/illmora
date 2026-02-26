from typing import List, Dict, Any
import wikipedia

class ResearchService:
    """
    Simulated Research Assistant Tools.
    Uses 'wikipedia' library as a free, proxy search engine because we lack paid SERP API keys.
    """
    
    def search_wikipedia(self, query: str, sentences: int = 3) -> str:
        """
        Searches Wikipedia for a topic and returns a summary.
        """
        try:
            # 1. Search for page titles
            search_results = wikipedia.search(query, results=1)
            
            if not search_results:
                return f"[No results found for '{query}']"
            
            page_title = search_results[0]
            
            # 2. Get Summary
            summary = wikipedia.summary(page_title, sentences=sentences)
            
            # 3. Get URL for citation
            page = wikipedia.page(page_title, auto_suggest=False)
            url = page.url
            
            return f"""
SOURCE: Wikipedia ({page_title})
URL: {url}
SUMMARY: {summary}
"""
        except wikipedia.exceptions.DisambiguationError as e:
            return f"[Ambiguous topic '{query}'. Options: {', '.join(e.options[:3])}]"
        except wikipedia.exceptions.PageError:
            return f"[Page not found for '{query}']"
        except Exception as e:
            return f"[Error searching '{query}': {str(e)}]"

    async def execute_research_plan(self, queries: List[str]) -> str:
        """
        Executes multiple search queries and aggregates results.
        """
        results = []
        for q in queries:
            res = self.search_wikipedia(q)
            results.append(res)
        
        return "\n---\n".join(results)
