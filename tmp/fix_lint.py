import sys

file_path = r'c:\Users\jerry\Documents\loamlabs llc\loamlabs-ops-dashboard\loamlabs-ops-dashboard\pages\index.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target block with duplicate style
target = """                                            style={{ 
                                               width: componentColumnWidths[componentTab + '_name'] || 300, 
                                               minWidth: componentColumnWidths[componentTab + '_name'] || 300 
                                            }}
                                            style={{ width: componentColumnWidths[componentTab + '_name'] || 300, minWidth: componentColumnWidths[componentTab + '_name'] || 300 }}"""

# Replacement block without duplicate style
replacement = """                                            style={{ 
                                               width: componentColumnWidths[componentTab + '_name'] || 300, 
                                               minWidth: componentColumnWidths[componentTab + '_name'] || 300 
                                            }}"""

if target in content:
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    # Try more loose matching if literal fails
    print("Literal match failed. Attempting loose match.")
    target_loose = "style={{ width: componentColumnWidths[componentTab + '_name'] || 300, minWidth: componentColumnWidths[componentTab + '_name'] || 300 }}"
    # Find all occurrences of the single line style
    count = content.count(target_loose)
    print(f"Found {count} occurrences of the single line style.")
    # We want to remove the one that is preceded by the multiline style
    # But for simplicity, if we find 2 on the same element, we can handle it.
