"""
Reading data validator and checksum calculator
"""

import hashlib
import json
from typing import Dict, Tuple, List


def validate_reading(reading: Dict) -> Tuple[bool, List[str]]:
    """
    Validate reading data structure and content
    Returns: (is_valid, list_of_errors)
    """
    errors = []

    # Check required top-level fields
    required_fields = ['date', 'liturgicalDate', 'firstReading', 'gospel', 'metadata']
    for field in required_fields:
        if field not in reading:
            errors.append(f"Missing required field: {field}")

    # Validate date format
    if 'date' in reading:
        try:
            # Should be ISO format: YYYY-MM-DD
            date_str = reading['date']
            if not isinstance(date_str, str) or len(date_str) != 10:
                errors.append("Invalid date format (expected YYYY-MM-DD)")
        except:
            errors.append("Invalid date value")

    # Validate first reading
    if 'firstReading' in reading and reading['firstReading']:
        errors.extend(validate_reading_section(reading['firstReading'], 'First Reading'))

    # Validate gospel (required)
    if 'gospel' in reading and reading['gospel']:
        errors.extend(validate_reading_section(reading['gospel'], 'Gospel'))
    else:
        errors.append("Gospel reading is required but missing")

    # Validate psalm
    if 'psalm' in reading and reading['psalm']:
        errors.extend(validate_psalm_section(reading['psalm']))

    # Validate second reading (optional - only on Sundays/Solemnities)
    if 'secondReading' in reading and reading['secondReading']:
        errors.extend(validate_reading_section(reading['secondReading'], 'Second Reading'))

    # Validate liturgical date
    if 'liturgicalDate' in reading:
        liturgical = reading['liturgicalDate']
        if not isinstance(liturgical, dict):
            errors.append("liturgicalDate must be an object")
        else:
            if 'season' not in liturgical:
                errors.append("liturgicalDate missing season")
            if 'dayOfWeek' not in liturgical:
                errors.append("liturgicalDate missing dayOfWeek")

    return (len(errors) == 0, errors)


def validate_reading_section(section: Dict, name: str) -> List[str]:
    """
    Validate a reading section (first, second, gospel)
    """
    errors = []

    required_fields = ['reference', 'citation', 'text', 'title']
    for field in required_fields:
        if field not in section:
            errors.append(f"{name}: Missing field '{field}'")
        elif not section[field]:
            errors.append(f"{name}: Field '{field}' is empty")

    # Validate text length (should have substantial content)
    if 'text' in section:
        text = section['text']
        if len(text) < 50:
            errors.append(f"{name}: Text too short ({len(text)} chars)")

    return errors


def validate_psalm_section(section: Dict) -> List[str]:
    """
    Validate psalm section (has additional 'response' field)
    """
    errors = validate_reading_section(section, 'Psalm')

    # Psalm should have response
    if 'response' not in section:
        errors.append("Psalm: Missing 'response' field")
    elif not section['response']:
        errors.append("Psalm: Response is empty")

    return errors


def calculate_checksum(reading: Dict) -> str:
    """
    Calculate MD5 checksum of reading content
    Used for cache validation and data integrity
    """
    try:
        # Create deterministic JSON representation
        # Only include content fields, not metadata
        content = {
            'date': reading.get('date'),
            'firstReading': reading.get('firstReading'),
            'psalm': reading.get('psalm'),
            'secondReading': reading.get('secondReading'),
            'gospel': reading.get('gospel'),
        }

        # Convert to sorted JSON string
        json_str = json.dumps(content, sort_keys=True, ensure_ascii=False)

        # Calculate MD5 hash
        checksum = hashlib.md5(json_str.encode('utf-8')).hexdigest()

        return checksum

    except Exception as e:
        # Fallback to simple hash if JSON serialization fails
        return hashlib.md5(str(reading).encode('utf-8')).hexdigest()


def verify_checksum(reading: Dict, expected_checksum: str) -> bool:
    """
    Verify reading data against expected checksum
    """
    actual_checksum = calculate_checksum(reading)
    return actual_checksum == expected_checksum
