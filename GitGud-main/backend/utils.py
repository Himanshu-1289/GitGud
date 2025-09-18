import requests, json, re
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def scraper(problem_url: str) -> str:
    """
    Fetch and extract the text description of a LeetCode problem given its URL.

    Args:
        problem_url (str): Full problem URL, e.g.
            'https://leetcode.com/problems/two-sum/description/'

    Returns:
        str: Plain-text problem description, or an error message.
    """
    # 1. Parse URL
    parsed = urlparse(problem_url)
    path = parsed.path.rstrip('/')  # drop trailing slash(es) :contentReference[oaicite:7]{index=7}

    # 2. Extract slug
    # Option A: split logic
    parts = path.split('/')
    if parts[-1] == 'description' and len(parts) >= 2:
        slug = parts[-2]
    else:
        slug = parts[-1]

    if not slug:
        return f"Error: could not extract problem slug from '{problem_url}'"

    # 3. Prepare GraphQL request
    url = 'https://leetcode.com/graphql/'
    headers = {
        'Content-Type': 'application/json',
        'Referer': f'https://leetcode.com/problems/{slug}/'
    }
    payload = {
        'operationName': 'questionData',
        'variables': {'titleSlug': slug},
        'query': '''
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            content
          }
        }
        '''
    }

    # 4. Fetch and parse
    try:
        resp = requests.post(url, headers=headers, data=json.dumps(payload))
        resp.raise_for_status()              # HTTP errors :contentReference[oaicite:8]{index=8}
        data = resp.json()
        if 'errors' in data:
            return f"Error from API: {data['errors']}"

        html = data['data']['question']['content']
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text(separator='\n', strip=True)

    except requests.RequestException as e:
        return f"Request failed: {e}"
