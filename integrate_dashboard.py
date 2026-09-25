#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto-integrate the new Dashboard Overview Redesign component
This script will backup and replace the old overview section
"""

import os
import re
import shutil
import sys
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# File path
DASHBOARD_FILE = "app/dashboard/page.jsx"
BACKUP_FILE = f"app/dashboard/page_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsx"

def integrate_new_overview():
    """Replace old overview section with new component"""
    
    print("[*] MyMobPay Dashboard Overview Integration Script")
    print("=" * 60)
    
    # Check if file exists
    if not os.path.exists(DASHBOARD_FILE):
        print(f"[X] Error: {DASHBOARD_FILE} not found!")
        return False
    
    # Read the file
    print(f"[>] Reading {DASHBOARD_FILE}...")
    with open(DASHBOARD_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create backup
    print(f"[B] Creating backup: {BACKUP_FILE}...")
    shutil.copy2(DASHBOARD_FILE, BACKUP_FILE)
    print(f"[OK] Backup created successfully!")
    
    # Find the overview section
    # Pattern: {activeTab === 'overview' && (
    #            <div className="space-y-6">
    #              ... content ...
    #            </div>
    #          )}
    
    # Find start
    start_pattern = r"{activeTab === 'overview' &&"
    start_match = re.search(start_pattern, content)
    
    if not start_match:
        print("[X] Could not find overview section start!")
        return False
    
    start_pos = start_match.start()
    print(f"[OK] Found overview section at position {start_pos}")
    
    # Find the opening parenthesis after &&
    open_paren_pos = content.find('(', start_pos + len(start_pattern))
    
    # Find the matching closing parenthesis and brace
    # We need to count nested parentheses
    paren_count = 1
    current_pos = open_paren_pos + 1
    
    while paren_count > 0 and current_pos < len(content):
        if content[current_pos] == '(':
            paren_count += 1
        elif content[current_pos] == ')':
            paren_count -= 1
        current_pos += 1
    
    if paren_count != 0:
        print("[X] Could not find matching closing parenthesis!")
        return False
    
    close_paren_pos = current_pos - 1
    print(f"[OK] Found section end at position {close_paren_pos}")
    
    # Extract the old content for reference
    old_content = content[start_pos:close_paren_pos + 2]  # +2 for )}\n
    old_lines = old_content.count('\n')
    print(f"[INFO] Old section: {old_lines} lines, {len(old_content)} characters")
    
    # New content to replace with
    new_content = """{activeTab === 'overview' && (
              <DashboardOverviewRedesign
                profile={profile}
                stats={stats}
                orders={orders}
                analyticsTimeframe={analyticsTimeframe}
                setAnalyticsTimeframe={setAnalyticsTimeframe}
                setActiveTab={setActiveTab}
              />
            )}"""
    
    # Replace
    print("[...] Replacing content...")
    new_file_content = content[:start_pos] + new_content + content[close_paren_pos + 2:]
    
    # Verify the import exists
    if 'DashboardOverviewRedesign' not in new_file_content:
        print("[!] Warning: Import for DashboardOverviewRedesign not found!")
        print("    Make sure you have this import at the top:")
        print("    import DashboardOverviewRedesign from '@/components/DashboardOverviewRedesign';")
        response = input("\n    Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("[X] Aborted.")
            return False
    
    # Write the new content
    print(f"[W] Writing updated file...")
    with open(DASHBOARD_FILE, 'w', encoding='utf-8') as f:
        f.write(new_file_content)
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Dashboard overview has been updated!")
    print("=" * 60)
    print(f"\n[INFO] Summary:")
    print(f"   - Backup saved to: {BACKUP_FILE}")
    print(f"   - Removed {old_lines} lines of old code")
    print(f"   - Added new DashboardOverviewRedesign component")
    print(f"\n[NEW] New features:")
    print(f"   [+] Clean light theme design")
    print(f"   [+] Gradient mP logo badge")
    print(f"   [+] 4 metric cards with hover effects")
    print(f"   [+] Custom SVG chart with peak markers")
    print(f"   [+] Recent transactions list")
    print(f"   [+] Payment rails pulse")
    print(f"   [+] Settlement banners")
    print(f"\n[NEXT] Next steps:")
    print(f"   1. Restart your dev server (npm run dev)")
    print(f"   2. Navigate to /dashboard")
    print(f"   3. Check the Overview tab")
    print(f"\n[REVERT] If you need to revert:")
    print(f"   cp {BACKUP_FILE} {DASHBOARD_FILE}")
    print()
    
    return True

if __name__ == "__main__":
    try:
        success = integrate_new_overview()
        if success:
            print("[DONE] Integration complete! Enjoy your new dashboard!")
        else:
            print("[X] Integration failed. Your original file is untouched.")
    except Exception as e:
        print(f"[X] Error: {e}")
        print(f"   Your original file should still be intact.")
        print(f"   Check the backup at: {BACKUP_FILE}")
