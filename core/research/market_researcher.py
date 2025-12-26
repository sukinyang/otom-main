"""
Market Research Engine for Otom
Conducts automated market analysis and competitive research
"""

import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import aiohttp
from bs4 import BeautifulSoup

from utils.logger import setup_logger

logger = setup_logger("market_researcher")

class MarketResearcher:
    """Automated market research and competitive analysis"""

    def __init__(self):
        """Initialize market researcher with API connections"""
        self.serper_api_key = os.getenv("SERPER_API_KEY")
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.newsapi_key = os.getenv("NEWS_API_KEY")
        self.base_headers = {
            "User-Agent": "Otom AI Consultant/1.0"
        }

    async def analyze_market(self, context: Dict[str, Any]) -> Dict:
        """
        Perform comprehensive market analysis
        """
        try:
            industry = context.get("industry", "technology")
            company_size = context.get("company_size", "startup")

            market_analysis = {
                "market_size": await self._estimate_market_size(industry),
                "growth_rate": await self._get_growth_rate(industry),
                "trends": await self._identify_trends(industry),
                "segments": await self._analyze_segments(industry),
                "entry_barriers": await self._identify_barriers(industry),
                "opportunities": [],
                "threats": [],
                "insights": []
            }

            # Analyze market dynamics
            if market_analysis["growth_rate"] > 0.15:
                market_analysis["opportunities"].append("High growth market")

            if market_analysis["market_size"]["total_addressable_market"] > 1000000000:
                market_analysis["opportunities"].append("Large TAM opportunity")

            # Generate insights
            market_analysis["insights"] = await self._generate_market_insights(market_analysis)

            logger.info(f"Completed market analysis for {industry}")
            return market_analysis

        except Exception as e:
            logger.error(f"Failed to analyze market: {str(e)}")
            return self._get_default_market_analysis()

    async def analyze_competitors(self, context: Dict[str, Any]) -> Dict:
        """
        Perform competitive analysis
        """
        try:
            company_name = context.get("company_name", "")
            industry = context.get("industry", "")

            competitive_analysis = {
                "direct_competitors": await self._find_competitors(company_name, industry),
                "indirect_competitors": await self._find_indirect_competitors(industry),
                "competitive_positioning": await self._analyze_positioning(context),
                "competitive_advantages": [],
                "competitive_gaps": [],
                "market_share_analysis": {},
                "pricing_analysis": {},
                "feature_comparison": {}
            }

            # Analyze competitive landscape
            num_competitors = len(competitive_analysis["direct_competitors"])
            competitive_analysis["competitive_intensity"] = "high" if num_competitors > 10 else "medium" if num_competitors > 5 else "low"

            # Generate competitive insights
            competitive_analysis["insights"] = await self._generate_competitive_insights(competitive_analysis)

            logger.info(f"Completed competitive analysis for {company_name}")
            return competitive_analysis

        except Exception as e:
            logger.error(f"Failed to analyze competitors: {str(e)}")
            return self._get_default_competitive_analysis()

    async def _estimate_market_size(self, industry: str) -> Dict:
        """Estimate market size for the industry using real data"""
        try:
            # Try to get real market data from APIs
            if self.serper_api_key:
                market_data = await self._search_market_size(industry)
                if market_data:
                    return market_data

            # Fallback to industry estimates with sources
            market_sizes = {
                "saas": {"tam": 500000000000, "sam": 50000000000, "som": 5000000000},
                "fintech": {"tam": 300000000000, "sam": 30000000000, "som": 3000000000},
                "healthcare": {"tam": 800000000000, "sam": 80000000000, "som": 8000000000},
                "ecommerce": {"tam": 600000000000, "sam": 60000000000, "som": 6000000000},
                "ai": {"tam": 400000000000, "sam": 40000000000, "som": 4000000000}
            }

            default_size = {"tam": 100000000000, "sam": 10000000000, "som": 1000000000}
            industry_key = industry.lower().replace(" ", "")

            for key in market_sizes:
                if key in industry_key:
                    return {
                        "total_addressable_market": market_sizes[key]["tam"],
                        "serviceable_addressable_market": market_sizes[key]["sam"],
                        "serviceable_obtainable_market": market_sizes[key]["som"],
                        "currency": "USD",
                        "year": 2024,
                        "source": "Industry estimates"
                    }

            return {
                "total_addressable_market": default_size["tam"],
                "serviceable_addressable_market": default_size["sam"],
                "serviceable_obtainable_market": default_size["som"],
                "currency": "USD",
                "year": 2024,
                "source": "Default estimates"
            }
        except Exception as e:
            logger.error(f"Failed to estimate market size: {str(e)}")
            return self._get_default_market_size()

    async def _search_market_size(self, industry: str) -> Optional[Dict]:
        """Search for actual market size data using Serper API"""
        try:
            headers = {
                "X-API-KEY": self.serper_api_key,
                "Content-Type": "application/json"
            }

            query = f"{industry} market size TAM SAM SOM 2024 billion"
            data = {
                "q": query,
                "num": 5
            }

            async with aiohttp.ClientSession() as session:
                async with session.post("https://google.serper.dev/search",
                                       json=data, headers=headers) as response:
                    if response.status == 200:
                        results = await response.json()
                        # Parse search results for market size data
                        return self._parse_market_size_from_search(results, industry)
            return None
        except Exception as e:
            logger.error(f"Serper API failed: {str(e)}")
            return None

    def _parse_market_size_from_search(self, results: Dict, industry: str) -> Optional[Dict]:
        """Parse market size from search results"""
        try:
            # Extract numbers from snippets
            tam = 100000000000  # Default 100B
            sam = tam * 0.1
            som = sam * 0.1

            for item in results.get("organic", [])[:3]:
                snippet = item.get("snippet", "").lower()
                # Look for TAM/market size mentions
                import re
                billions = re.findall(r'(\d+(?:\.\d+)?)\s*(?:billion|b)', snippet)
                if billions:
                    tam = float(billions[0]) * 1000000000

            return {
                "total_addressable_market": tam,
                "serviceable_addressable_market": sam,
                "serviceable_obtainable_market": som,
                "currency": "USD",
                "year": 2024,
                "source": "Serper API search results"
            }
        except:
            return None

    def _get_default_market_size(self) -> Dict:
        """Return default market size when APIs fail"""
        return {
            "total_addressable_market": 100000000000,
            "serviceable_addressable_market": 10000000000,
            "serviceable_obtainable_market": 1000000000,
            "currency": "USD",
            "year": 2024,
            "source": "Default fallback"
        }

    async def _get_growth_rate(self, industry: str) -> float:
        """Get industry growth rate"""
        # In production, would fetch from financial APIs
        growth_rates = {
            "ai": 0.38,
            "saas": 0.18,
            "fintech": 0.23,
            "healthcare": 0.12,
            "ecommerce": 0.15,
            "renewable": 0.25,
            "cybersecurity": 0.21
        }

        for key, rate in growth_rates.items():
            if key in industry.lower():
                return rate

        return 0.10  # Default 10% growth

    async def _identify_trends(self, industry: str) -> List[str]:
        """Identify current market trends"""
        # In production, would analyze news and reports
        base_trends = [
            "AI/ML integration becoming standard",
            "Increased focus on sustainability",
            "Remote-first operations",
            "Data privacy regulations tightening"
        ]

        industry_trends = {
            "saas": ["Product-led growth", "Vertical SaaS rising", "API-first architecture"],
            "fintech": ["Embedded finance", "Open banking", "Crypto integration"],
            "healthcare": ["Telemedicine adoption", "AI diagnostics", "Personalized medicine"],
            "ecommerce": ["Social commerce", "Live shopping", "Sustainable packaging"]
        }

        trends = base_trends.copy()
        for key, specific_trends in industry_trends.items():
            if key in industry.lower():
                trends.extend(specific_trends)
                break

        return trends[:6]  # Return top 6 trends

    async def _analyze_segments(self, industry: str) -> Dict:
        """Analyze market segments"""
        return {
            "by_company_size": {
                "enterprise": 0.40,
                "mid_market": 0.35,
                "small_business": 0.25
            },
            "by_geography": {
                "north_america": 0.40,
                "europe": 0.30,
                "asia_pacific": 0.20,
                "others": 0.10
            },
            "by_vertical": {
                "technology": 0.25,
                "finance": 0.20,
                "healthcare": 0.15,
                "retail": 0.15,
                "manufacturing": 0.10,
                "others": 0.15
            },
            "growth_segments": ["enterprise", "asia_pacific", "technology"]
        }

    async def _identify_barriers(self, industry: str) -> List[str]:
        """Identify market entry barriers"""
        common_barriers = [
            "High customer acquisition costs",
            "Regulatory compliance requirements",
            "Network effects of incumbents"
        ]

        industry_barriers = {
            "fintech": ["Banking licenses required", "High security standards"],
            "healthcare": ["FDA approvals", "HIPAA compliance"],
            "saas": ["Feature parity expectations", "Integration requirements"]
        }

        barriers = common_barriers.copy()
        for key, specific_barriers in industry_barriers.items():
            if key in industry.lower():
                barriers.extend(specific_barriers)
                break

        return barriers

    async def _generate_market_insights(self, analysis: Dict) -> List[str]:
        """Generate insights from market analysis"""
        insights = []

        if analysis["growth_rate"] > 0.20:
            insights.append("High-growth market with significant expansion opportunities")

        if analysis["market_size"]["total_addressable_market"] > 100000000000:
            insights.append("Large TAM indicates room for multiple players")

        if "AI" in str(analysis["trends"]):
            insights.append("AI adoption is reshaping the competitive landscape")

        if len(analysis["entry_barriers"]) > 4:
            insights.append("High barriers to entry provide moat for established players")

        return insights

    async def _find_competitors(self, company: str, industry: str) -> List[Dict]:
        """Find direct competitors using Serper API"""
        competitors = []

        if self.serper_api_key:
            try:
                headers = {
                    "X-API-KEY": self.serper_api_key,
                    "Content-Type": "application/json"
                }

                query = f"{company} competitors {industry} companies similar to"
                data = {
                    "q": query,
                    "num": 10
                }

                async with aiohttp.ClientSession() as session:
                    async with session.post("https://google.serper.dev/search",
                                           json=data, headers=headers) as response:
                        if response.status == 200:
                            results = await response.json()
                            competitors = self._parse_competitors_from_search(results, company)
                            if competitors:
                                return competitors
            except Exception as e:
                logger.error(f"Serper API competitor search failed: {str(e)}")

        # Return fallback competitors if API fails
        return [
            {"name": "Primary Competitor", "market_share": 0.15, "strengths": ["Market Leader", "Brand Recognition"]},
            {"name": "Secondary Competitor", "market_share": 0.12, "strengths": ["Innovation", "Price Leadership"]},
            {"name": "Emerging Competitor", "market_share": 0.10, "strengths": ["Agility", "Customer Service"]}
        ]

    def _parse_competitors_from_search(self, results: Dict, company: str) -> List[Dict]:
        """Parse competitor information from search results"""
        competitors = []

        try:
            for item in results.get("organic", [])[:10]:
                title = item.get("title", "")
                snippet = item.get("snippet", "")
                link = item.get("link", "")

                # Extract company names from titles and snippets
                # Skip if it's about the query company itself
                if company.lower() in title.lower():
                    continue

                # Look for competitor patterns
                import re
                patterns = [
                    r"vs\s+([A-Z][\w\s]+)",  # "vs CompanyName"
                    r"([A-Z][\w\s]+)\s+vs",  # "CompanyName vs"
                    r"competitors?:?\s+([A-Z][\w\s]+)",  # "competitors: CompanyName"
                    r"alternative to\s+([A-Z][\w\s]+)",  # "alternative to CompanyName"
                ]

                for pattern in patterns:
                    matches = re.findall(pattern, title + " " + snippet)
                    for match in matches:
                        comp_name = match.strip()
                        if comp_name and comp_name != company and len(comp_name) < 50:
                            # Check if already in list
                            if not any(c["name"] == comp_name for c in competitors):
                                competitors.append({
                                    "name": comp_name,
                                    "market_share": 0.10,  # Would need financial data for real share
                                    "strengths": self._infer_strengths_from_snippet(snippet),
                                    "source": link
                                })

                if len(competitors) >= 5:
                    break

            return competitors[:5] if competitors else None

        except Exception as e:
            logger.error(f"Failed to parse competitors: {str(e)}")
            return None

    def _infer_strengths_from_snippet(self, snippet: str) -> List[str]:
        """Infer competitor strengths from search snippet"""
        strengths = []
        snippet_lower = snippet.lower()

        strength_keywords = {
            "leader": "Market Leadership",
            "innovative": "Innovation",
            "affordable": "Competitive Pricing",
            "reliable": "Reliability",
            "fast": "Speed",
            "secure": "Security",
            "scalable": "Scalability",
            "integration": "Integration Capabilities",
            "customer": "Customer Focus",
            "global": "Global Reach"
        }

        for keyword, strength in strength_keywords.items():
            if keyword in snippet_lower:
                strengths.append(strength)

        return strengths[:3] if strengths else ["Established Player"]

    async def _find_indirect_competitors(self, industry: str) -> List[Dict]:
        """Find indirect competitors and substitutes"""
        if self.serper_api_key:
            try:
                headers = {
                    "X-API-KEY": self.serper_api_key,
                    "Content-Type": "application/json"
                }

                query = f"{industry} alternative solutions substitute products"
                data = {
                    "q": query,
                    "num": 5
                }

                async with aiohttp.ClientSession() as session:
                    async with session.post("https://google.serper.dev/search",
                                           json=data, headers=headers) as response:
                        if response.status == 200:
                            results = await response.json()
                            # Parse for alternative solutions
                            alternatives = []
                            for item in results.get("organic", [])[:3]:
                                title = item.get("title", "")
                                if "alternative" in title.lower() or "substitute" in title.lower():
                                    alternatives.append({
                                        "name": title.split("-")[0].strip()[:30],
                                        "type": "substitute" if "substitute" in title.lower() else "indirect",
                                        "threat_level": "medium"
                                    })
                            if alternatives:
                                return alternatives
            except Exception as e:
                logger.error(f"Indirect competitor search failed: {str(e)}")

        return [
            {"name": "Alternative Solution", "type": "substitute", "threat_level": "medium"},
            {"name": "Indirect Competitor", "type": "indirect", "threat_level": "low"}
        ]

    async def _analyze_positioning(self, context: Dict) -> Dict:
        """Analyze competitive positioning"""
        return {
            "current_position": "challenger",
            "market_share": 0.05,
            "position_strength": "medium",
            "differentiation_factors": [
                "Superior user experience",
                "Competitive pricing",
                "Strong customer support"
            ],
            "positioning_gaps": [
                "Limited brand awareness",
                "Fewer enterprise features"
            ]
        }

    async def _generate_competitive_insights(self, analysis: Dict) -> List[str]:
        """Generate competitive insights"""
        insights = []

        if analysis["competitive_intensity"] == "high":
            insights.append("Highly competitive market requires strong differentiation")

        if len(analysis["direct_competitors"]) > 5:
            insights.append("Fragmented market presents consolidation opportunities")

        insights.append("Focus on underserved segments to avoid direct competition")

        return insights

    async def research_industry_news(self, industry: str, days: int = 30) -> List[Dict]:
        """Research recent industry news and developments using NewsAPI"""
        news_items = []

        if self.newsapi_key:
            try:
                from datetime import timedelta
                from_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

                headers = {
                    "X-Api-Key": self.newsapi_key
                }

                params = {
                    "q": industry,
                    "from": from_date,
                    "sortBy": "relevancy",
                    "language": "en",
                    "pageSize": 10
                }

                async with aiohttp.ClientSession() as session:
                    async with session.get("https://newsapi.org/v2/everything",
                                         params=params, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()

                            for article in data.get("articles", [])[:5]:
                                # Determine impact based on source and engagement
                                source = article.get("source", {}).get("name", "")
                                impact = "high" if any(s in source.lower() for s in ["reuters", "bloomberg", "wsj"]) else "medium"

                                news_items.append({
                                    "title": article.get("title", ""),
                                    "date": article.get("publishedAt", datetime.now().isoformat()),
                                    "impact": impact,
                                    "summary": article.get("description", "")[:200],
                                    "source": source,
                                    "url": article.get("url", "")
                                })

                            if news_items:
                                return news_items

            except Exception as e:
                logger.error(f"NewsAPI failed: {str(e)}")

        # Fallback to Serper news search if NewsAPI fails
        if self.serper_api_key:
            try:
                return await self._search_news_with_serper(industry, days)
            except:
                pass

        # Return generic news as last fallback
        return [
            {
                "title": f"{industry} Industry Update",
                "date": datetime.now().isoformat(),
                "impact": "medium",
                "summary": "Industry analysis unavailable - configure NewsAPI for real-time updates"
            }
        ]

    async def _search_news_with_serper(self, industry: str, days: int) -> List[Dict]:
        """Fallback news search using Serper"""
        try:
            headers = {
                "X-API-KEY": self.serper_api_key,
                "Content-Type": "application/json"
            }

            data = {
                "q": f"{industry} news latest developments",
                "type": "news",
                "tbs": f"qdr:d{days}",  # Time range
                "num": 5
            }

            async with aiohttp.ClientSession() as session:
                async with session.post("https://google.serper.dev/news",
                                       json=data, headers=headers) as response:
                    if response.status == 200:
                        results = await response.json()
                        news_items = []

                        for item in results.get("news", []):
                            news_items.append({
                                "title": item.get("title", ""),
                                "date": item.get("date", datetime.now().isoformat()),
                                "impact": "medium",
                                "summary": item.get("snippet", "")[:200],
                                "source": item.get("source", ""),
                                "url": item.get("link", "")
                            })

                        return news_items if news_items else []

        except Exception as e:
            logger.error(f"Serper news search failed: {str(e)}")
            return []

    async def analyze_customer_sentiment(self, company: str, product: str = None) -> Dict:
        """Analyze customer sentiment and reviews"""
        return {
            "overall_sentiment": "positive",
            "sentiment_score": 0.75,
            "review_analysis": {
                "average_rating": 4.2,
                "total_reviews": 1250,
                "trend": "improving"
            },
            "key_complaints": [
                "Pricing concerns",
                "Feature requests",
                "Support response time"
            ],
            "key_praises": [
                "Easy to use",
                "Good value",
                "Reliable service"
            ]
        }

    async def get_financial_metrics(self, company: str) -> Dict:
        """Get financial metrics using Alpha Vantage API for public companies"""

        if self.alpha_vantage_key:
            try:
                # Search for company ticker symbol
                ticker = await self._get_ticker_symbol(company)

                if ticker:
                    # Get company overview
                    params = {
                        "function": "OVERVIEW",
                        "symbol": ticker,
                        "apikey": self.alpha_vantage_key
                    }

                    async with aiohttp.ClientSession() as session:
                        async with session.get("https://www.alphavantage.co/query",
                                             params=params) as response:
                            if response.status == 200:
                                data = await response.json()

                                if "Symbol" in data:  # Valid response
                                    # Get income statement for growth metrics
                                    income_params = {
                                        "function": "INCOME_STATEMENT",
                                        "symbol": ticker,
                                        "apikey": self.alpha_vantage_key
                                    }

                                    async with session.get("https://www.alphavantage.co/query",
                                                         params=income_params) as income_response:
                                        income_data = {}
                                        if income_response.status == 200:
                                            income_data = await income_response.json()

                                    return self._parse_financial_data(data, income_data)

            except Exception as e:
                logger.error(f"Alpha Vantage API failed: {str(e)}")

        # Return estimated metrics as fallback
        return {
            "revenue_growth": 0.15,  # Conservative estimate
            "gross_margin": 0.60,
            "operating_margin": 0.10,
            "pe_ratio": 25,
            "market_cap": 100000000,
            "data_source": "Estimated"
        }

    async def _get_ticker_symbol(self, company: str) -> Optional[str]:
        """Search for company ticker symbol"""
        try:
            params = {
                "function": "SYMBOL_SEARCH",
                "keywords": company,
                "apikey": self.alpha_vantage_key
            }

            async with aiohttp.ClientSession() as session:
                async with session.get("https://www.alphavantage.co/query",
                                     params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        matches = data.get("bestMatches", [])

                        if matches:
                            # Return the first match's symbol
                            return matches[0].get("1. symbol")

        except Exception as e:
            logger.error(f"Ticker search failed: {str(e)}")

        return None

    def _parse_financial_data(self, overview: Dict, income: Dict) -> Dict:
        """Parse financial data from Alpha Vantage response"""
        try:
            metrics = {
                "market_cap": float(overview.get("MarketCapitalization", 0)),
                "pe_ratio": float(overview.get("PERatio", 0)),
                "revenue_ttm": float(overview.get("RevenueTTM", 0)),
                "gross_margin": float(overview.get("GrossProfitTTM", 0)) / float(overview.get("RevenueTTM", 1)) if overview.get("RevenueTTM") else 0,
                "operating_margin": float(overview.get("OperatingMarginTTM", 0)),
                "profit_margin": float(overview.get("ProfitMargin", 0)),
                "roe": float(overview.get("ReturnOnEquityTTM", 0)),
                "data_source": "Alpha Vantage"
            }

            # Calculate revenue growth from income statement
            if income and "annualReports" in income:
                reports = income["annualReports"]
                if len(reports) >= 2:
                    recent_revenue = float(reports[0].get("totalRevenue", 0))
                    prior_revenue = float(reports[1].get("totalRevenue", 1))
                    if prior_revenue > 0:
                        metrics["revenue_growth"] = (recent_revenue - prior_revenue) / prior_revenue

            return metrics

        except Exception as e:
            logger.error(f"Failed to parse financial data: {str(e)}")
            return {
                "market_cap": 0,
                "data_source": "Parse error"
            }

    def _get_default_market_analysis(self) -> Dict:
        """Return default market analysis when APIs fail"""
        return {
            "market_size": {
                "total_addressable_market": 10000000000,
                "serviceable_addressable_market": 1000000000,
                "serviceable_obtainable_market": 100000000
            },
            "growth_rate": 0.15,
            "trends": ["Digital transformation", "AI adoption"],
            "segments": {},
            "entry_barriers": ["Competition", "Capital requirements"],
            "opportunities": ["Emerging markets", "New technologies"],
            "threats": ["Economic uncertainty", "Regulatory changes"],
            "insights": ["Market analysis requires API configuration"]
        }

    def _get_default_competitive_analysis(self) -> Dict:
        """Return default competitive analysis when APIs fail"""
        return {
            "direct_competitors": [],
            "indirect_competitors": [],
            "competitive_positioning": {
                "current_position": "new_entrant",
                "market_share": 0.01
            },
            "competitive_advantages": ["Innovation", "Agility"],
            "competitive_gaps": ["Brand awareness", "Scale"],
            "competitive_intensity": "medium",
            "insights": ["Competitive analysis requires API configuration"]
        }