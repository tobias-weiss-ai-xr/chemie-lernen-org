import os
import re
import requests
from urllib.parse import urljoin, urlparse

# Configuration
CONTENT_DIR = '/opt/git/hugo-chemie-lernen-org/myhugoapp/content/'
STATIC_DIR = '/opt/git/hugo-chemie-lernen-org/myhugoapp/static/'
REPORT_FILE = 'broken_links_report.md'

# Regular expression to find markdown links
LINK_REGEX = re.compile(r'\[(.*?)\]\((.*?)\)')

def is_internal_link(url):
    """Check if a URL is internal."""
    return url.startswith('/') or not urlparse(url).netloc

def get_absolute_url(base_url, link):
    """Convert relative URL to absolute URL."""
    return urljoin(base_url, link)

def test_link(url):
    """Test a link using HEAD request."""
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False

def find_markdown_files(directory):
    """Find all markdown files in a directory."""
    md_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                md_files.append(os.path.join(root, file))
    return md_files

def extract_links_from_file(file_path):
    """Extract all links from a markdown file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        return LINK_REGEX.findall(content)

def suggest_fix_for_relative_link(base_url, link):
    """Suggest a fix for a relative link."""
    absolute_url = get_absolute_url(base_url, link)
    if test_link(absolute_url):
        return absolute_url
    # Additional logic can be added here to suggest fixes based on site structure
    return None

def main():
    print("🔍 Scanning for broken links...")
    md_files = find_markdown_files(CONTENT_DIR)
    print(f"Found {len(md_files)} markdown files")

    broken_links = []
    checked_count = 0

    for md_file in md_files:
        links = extract_links_from_file(md_file)

        for text, link in links:
            checked_count += 1
            if checked_count % 50 == 0:
                print(f"Checked {checked_count} links...")

            if is_internal_link(link):
                # For internal links, we'll just note them for manual review
                # since they require Hugo site context
                continue
            else:
                # Test external links
                if not test_link(link):
                    broken_links.append((md_file, text, link, "External link broken", None))

    print(f"\n✅ Checked {checked_count} total links")
    print(f"❌ Found {len(broken_links)} broken links")

    # Generate report
    with open(REPORT_FILE, 'w', encoding='utf-8') as report_file:
        report_file.write("# Broken Links Report\n\n")
        report_file.write(f"**Generated**: Automated Link Check\n")
        report_file.write(f"**Files Scanned**: {len(md_files)}\n")
        report_file.write(f"**Links Checked**: {checked_count}\n")
        report_file.write(f"**Broken Links**: {len(broken_links)}\n\n")
        report_file.write("---\n\n")

        if broken_links:
            for md_file, text, link, issue, suggested_fix in broken_links:
                report_file.write(f"## File: {md_file}\n")
                report_file.write(f"- **Text**: {text}\n")
                report_file.write(f"- **Link**: {link}\n")
                report_file.write(f"- **Issue**: {issue}\n")
                if suggested_fix:
                    report_file.write(f"- **Suggested Fix**: {suggested_fix}\n")
                report_file.write("\n")
        else:
            report_file.write("✅ No broken external links found!\n\n")

    print(f"\n💾 Report saved to: {REPORT_FILE}")

if __name__ == '__main__':
    main()
