import sys
import os

file_path = r'c:\Users\jerry\Documents\loamlabs llc\loamlabs-ops-dashboard\loamlabs-ops-dashboard\pages\index.js'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indentified target line:
# 2670:                                            style={{ width: componentColumnWidths[componentTab + '_name'] || 300, minWidth: componentColumnWidths[componentTab + '_name'] || 300 }}

target_line = "style={{ width: componentColumnWidths[componentTab + '_name'] || 300, minWidth: componentColumnWidths[componentTab + '_name'] || 300 }}\n"

new_lines = []
for line in lines:
    if target_line in line:
        # Check if previous line is also style or related
        # But based on our view_file, line 2670 is the one we want to remove
        print(f"Removing line: {line.strip()}")
        continue # Skip this line
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Successfully processed index.js.")
