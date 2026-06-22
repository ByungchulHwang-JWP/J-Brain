"""Text normalization for RAG ingestion."""

import re
import unicodedata


class TextNormalizer:
    """Normalize text before parsing, chunking, embedding, and extraction."""

    def __init__(
        self,
        normalize_unicode: bool = True,
        collapse_spaces: bool = True,
        strip_control_chars: bool = True,
    ) -> None:
        self.normalize_unicode = normalize_unicode
        self.collapse_spaces = collapse_spaces
        self.strip_control_chars = strip_control_chars

    def normalize(self, text: str) -> str:
        """Return normalized text."""

        value = text
        if self.normalize_unicode:
            value = unicodedata.normalize("NFC", value)
        if self.strip_control_chars:
            value = "".join(
                char
                for char in value
                if char in "\n\t" or unicodedata.category(char)[0] != "C"
            )
        value = value.replace("\r\n", "\n").replace("\r", "\n")
        if self.collapse_spaces:
            value = re.sub(r"[ \t]+", " ", value)
            value = re.sub(r"\n{3,}", "\n\n", value)
        return value.strip()

