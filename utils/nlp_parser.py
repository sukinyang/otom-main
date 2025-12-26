"""
NLP Parser for Email and Text Analysis
Uses spaCy for entity extraction and intent recognition
"""

import re
from typing import Dict, List, Any, Optional
import spacy
from spacy.matcher import Matcher

from utils.logger import setup_logger

logger = setup_logger("nlp_parser")


class NLPParser:
    """NLP parser for extracting structured information from text"""

    def __init__(self):
        """Initialize NLP parser with spaCy model"""
        try:
            # Try to load the model, download if not available
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Installing en_core_web_sm...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")

        # Initialize matcher for pattern matching
        self.matcher = Matcher(self.nlp.vocab)
        self._setup_patterns()

    def _setup_patterns(self):
        """Setup common business patterns for matching"""
        # Company patterns
        company_pattern = [
            {"LOWER": {"IN": ["company", "organization", "firm", "business"]}},
            {"LOWER": {"IN": ["is", "called", "named", ":"]}},
            {"POS": "PROPN", "OP": "+"}
        ]
        self.matcher.add("COMPANY", [company_pattern])

        # Industry patterns
        industry_pattern = [
            {"LOWER": {"IN": ["industry", "sector", "field", "market"]}},
            {"LOWER": {"IN": ["is", ":"]}},
            {"POS": {"IN": ["NOUN", "PROPN"]}, "OP": "+"}
        ]
        self.matcher.add("INDUSTRY", [industry_pattern])

        # Revenue patterns
        revenue_pattern = [
            {"LOWER": {"IN": ["revenue", "sales", "income"]}},
            {"LOWER": {"IN": ["is", "of", ":", "approximately", "around"]}},
            {"LIKE_NUM": True, "OP": "+"}
        ]
        self.matcher.add("REVENUE", [revenue_pattern])

        # Employee count patterns
        employee_pattern = [
            {"LIKE_NUM": True},
            {"LOWER": {"IN": ["employees", "people", "staff", "workers"]}}
        ]
        self.matcher.add("EMPLOYEES", [employee_pattern])

        # Challenge/problem patterns
        challenge_pattern = [
            {"LOWER": {"IN": ["challenge", "problem", "issue", "difficulty", "struggle"]}},
            {"LOWER": {"IN": ["is", "with", ":"]}},
            {"POS": {"IN": ["NOUN", "VERB"]}, "OP": "+"}
        ]
        self.matcher.add("CHALLENGE", [challenge_pattern])

    def parse_email(self, email_body: str) -> Dict[str, Any]:
        """
        Parse email body to extract business context
        """
        doc = self.nlp(email_body)
        context = {}

        # Extract entities
        entities = self._extract_entities(doc)
        if entities:
            context.update(entities)

        # Extract patterns
        patterns = self._extract_patterns(doc)
        if patterns:
            context.update(patterns)

        # Extract intent
        intent = self._classify_intent(doc)
        if intent:
            context["intent"] = intent

        # Extract key phrases
        key_phrases = self._extract_key_phrases(doc)
        if key_phrases:
            context["key_phrases"] = key_phrases

        # Extract questions
        questions = self._extract_questions(email_body)
        if questions:
            context["questions"] = questions

        # Extract metrics and numbers
        metrics = self._extract_metrics(doc)
        if metrics:
            context["metrics"] = metrics

        return context

    def _extract_entities(self, doc) -> Dict:
        """Extract named entities from document"""
        entities = {}

        for ent in doc.ents:
            if ent.label_ == "ORG" and "company" not in entities:
                entities["company"] = ent.text
            elif ent.label_ == "PERSON" and "contact_name" not in entities:
                entities["contact_name"] = ent.text
            elif ent.label_ == "GPE" and "location" not in entities:
                entities["location"] = ent.text
            elif ent.label_ == "DATE":
                if "timeline" not in entities:
                    entities["timeline"] = []
                entities["timeline"].append(ent.text)
            elif ent.label_ == "MONEY":
                amount = self._parse_money(ent.text)
                if amount:
                    if "budget" not in entities and any(word in ent.text.lower() for word in ["budget", "spend"]):
                        entities["budget"] = amount
                    elif "revenue" not in entities and any(word in ent.text.lower() for word in ["revenue", "sales"]):
                        entities["revenue"] = amount

        return entities

    def _extract_patterns(self, doc) -> Dict:
        """Extract patterns using matcher"""
        patterns = {}
        matches = self.matcher(doc)

        for match_id, start, end in matches:
            span = doc[start:end]
            match_label = self.nlp.vocab.strings[match_id]

            if match_label == "COMPANY":
                # Extract company name after the pattern
                company_text = span.text
                company_name = " ".join([token.text for token in span if token.pos_ == "PROPN"])
                if company_name:
                    patterns["company"] = company_name

            elif match_label == "INDUSTRY":
                industry_text = span.text.lower()
                # Extract the actual industry name
                industry_words = [token.text for token in span if token.pos_ in ["NOUN", "PROPN"] and
                                 token.text.lower() not in ["industry", "sector", "field", "market", "is"]]
                if industry_words:
                    patterns["industry"] = " ".join(industry_words)

            elif match_label == "REVENUE":
                revenue_text = span.text
                amount = self._extract_amount_from_text(revenue_text)
                if amount:
                    patterns["revenue"] = amount

            elif match_label == "EMPLOYEES":
                employee_text = span.text
                count = self._extract_number_from_text(employee_text)
                if count:
                    patterns["employees"] = count

            elif match_label == "CHALLENGE":
                challenge_text = span.text
                # Extract the actual challenge description
                challenge_words = [token.text for token in span if
                                 token.text.lower() not in ["challenge", "problem", "issue", "is", "with"]]
                if challenge_words:
                    if "challenges" not in patterns:
                        patterns["challenges"] = []
                    patterns["challenges"].append(" ".join(challenge_words))

        return patterns

    def _classify_intent(self, doc) -> str:
        """Classify the intent of the message"""
        text_lower = doc.text.lower()

        # Check for specific intents
        if any(word in text_lower for word in ["strategy", "strategic", "plan", "roadmap"]):
            return "strategy_consultation"
        elif any(word in text_lower for word in ["workflow", "process", "efficiency", "bottleneck"]):
            return "workflow_optimization"
        elif any(word in text_lower for word in ["market", "competitor", "competitive", "analysis"]):
            return "market_analysis"
        elif any(word in text_lower for word in ["growth", "scale", "expand", "expansion"]):
            return "growth_planning"
        elif any(word in text_lower for word in ["cost", "reduce", "save", "cut"]):
            return "cost_optimization"
        elif any(word in text_lower for word in ["transform", "digital", "innovation"]):
            return "digital_transformation"
        else:
            return "general_consultation"

    def _extract_key_phrases(self, doc) -> List[str]:
        """Extract key noun phrases from document"""
        key_phrases = []

        # Extract noun chunks
        for chunk in doc.noun_chunks:
            # Filter out common/unimportant phrases
            if len(chunk.text.split()) >= 2 and chunk.root.dep_ in ["nsubj", "dobj", "pobj"]:
                key_phrases.append(chunk.text)

        return list(set(key_phrases))[:10]  # Return top 10 unique phrases

    def _extract_questions(self, text: str) -> List[str]:
        """Extract questions from text"""
        questions = []
        sentences = text.split(".")

        for sentence in sentences:
            sentence = sentence.strip()
            # Check if it's a question
            if "?" in sentence or any(sentence.lower().startswith(q) for q in
                                     ["what", "how", "why", "when", "where", "who", "which", "can", "could", "would"]):
                questions.append(sentence.replace("?", "").strip() + "?")

        return questions

    def _extract_metrics(self, doc) -> Dict:
        """Extract business metrics and numbers"""
        metrics = {}

        for token in doc:
            if token.like_num or token.pos_ == "NUM":
                # Look at surrounding context
                context_window = 3
                start = max(0, token.i - context_window)
                end = min(len(doc), token.i + context_window)
                context = doc[start:end].text.lower()

                # Categorize the number based on context
                if any(word in context for word in ["revenue", "sales", "income"]):
                    metrics["revenue_mentioned"] = token.text
                elif any(word in context for word in ["employee", "staff", "people"]):
                    metrics["employee_count"] = self._parse_number(token.text)
                elif any(word in context for word in ["year", "annual", "monthly", "quarter"]):
                    metrics["time_period"] = token.text
                elif any(word in context for word in ["percent", "%", "growth", "increase", "decrease"]):
                    metrics["percentage"] = token.text
                elif any(word in context for word in ["customer", "client", "user"]):
                    metrics["customer_count"] = self._parse_number(token.text)

        return metrics

    def _parse_money(self, text: str) -> Optional[float]:
        """Parse monetary amount from text"""
        try:
            # Remove currency symbols and commas
            cleaned = re.sub(r'[$£€,]', '', text)

            # Handle millions/billions
            if 'million' in cleaned.lower() or 'm' in cleaned.lower():
                number = re.search(r'[\d.]+', cleaned)
                if number:
                    return float(number.group()) * 1000000
            elif 'billion' in cleaned.lower() or 'b' in cleaned.lower():
                number = re.search(r'[\d.]+', cleaned)
                if number:
                    return float(number.group()) * 1000000000
            elif 'thousand' in cleaned.lower() or 'k' in cleaned.lower():
                number = re.search(r'[\d.]+', cleaned)
                if number:
                    return float(number.group()) * 1000
            else:
                number = re.search(r'[\d.]+', cleaned)
                if number:
                    return float(number.group())
        except:
            pass
        return None

    def _parse_number(self, text: str) -> Optional[int]:
        """Parse integer from text"""
        try:
            # Remove commas and extract number
            cleaned = re.sub(r',', '', text)
            number = re.search(r'\d+', cleaned)
            if number:
                return int(number.group())
        except:
            pass
        return None

    def _extract_amount_from_text(self, text: str) -> Optional[float]:
        """Extract monetary amount from text"""
        return self._parse_money(text)

    def _extract_number_from_text(self, text: str) -> Optional[int]:
        """Extract number from text"""
        return self._parse_number(text)

    def parse_consultation_request(self, text: str) -> Dict:
        """
        Parse a consultation request to extract all relevant information
        """
        doc = self.nlp(text)

        result = {
            "context": self.parse_email(text),
            "urgency": self._assess_urgency(doc),
            "complexity": self._assess_complexity(doc),
            "service_type": self._determine_service_type(doc),
            "estimated_scope": self._estimate_scope(doc)
        }

        return result

    def _assess_urgency(self, doc) -> str:
        """Assess urgency of request"""
        text_lower = doc.text.lower()

        if any(word in text_lower for word in ["urgent", "asap", "immediately", "critical", "emergency"]):
            return "high"
        elif any(word in text_lower for word in ["soon", "quickly", "fast", "rapid"]):
            return "medium"
        else:
            return "normal"

    def _assess_complexity(self, doc) -> str:
        """Assess complexity of request"""
        # Count entities, questions, and topics
        num_entities = len(doc.ents)
        num_questions = len(self._extract_questions(doc.text))
        num_topics = len(set([token.lemma_ for token in doc if token.pos_ in ["NOUN", "VERB"]]))

        complexity_score = num_entities + num_questions + (num_topics / 10)

        if complexity_score > 15:
            return "high"
        elif complexity_score > 8:
            return "medium"
        else:
            return "low"

    def _determine_service_type(self, doc) -> str:
        """Determine the type of service needed"""
        intent = self._classify_intent(doc)

        service_map = {
            "strategy_consultation": "strategic_planning",
            "workflow_optimization": "workflow_mapping",
            "market_analysis": "market_research",
            "growth_planning": "growth_strategy",
            "cost_optimization": "cost_reduction",
            "digital_transformation": "transformation",
            "general_consultation": "general_consulting"
        }

        return service_map.get(intent, "general_consulting")

    def _estimate_scope(self, doc) -> str:
        """Estimate the scope of work"""
        complexity = self._assess_complexity(doc)
        urgency = self._assess_urgency(doc)

        if complexity == "high" or urgency == "high":
            return "comprehensive"
        elif complexity == "medium":
            return "standard"
        else:
            return "quick_assessment"