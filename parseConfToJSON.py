import re
import json

def parse_conf_line(line):
    line = line.strip()
    if not line or line.startswith('//'):
        return None, None, None
    if line.endswith('{'):
        return 'section_start', line.split(' ')[0], None
    elif line == '}':
        return 'section_end', None, None
    else:
        match = re.match(r'(\S+)\s+"\{([^}]+)\}"', line)  # Capture entire value within "{}"
        if match:
            key, id_value = match.groups()
            return 'keybind_start', key, id_value
        match = re.match(r'(\S+)\s+"([^"]+)"', line)  # Match other property lines
        if match:
            key, value = match.groups()
            return 'property', key, value
    return None, None, None

def parse_conf_file(file_path):
    result = {}
    stack = [result]

    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            line_type, key, value = parse_conf_line(line)

            if line_type == 'section_start':
                new_section = {}
                stack[-1][key] = new_section
                stack.append(new_section)
            elif line_type == 'section_end':
                stack.pop()
            elif line_type == 'keybind_start':
                new_keybind = {'_id': value}  # Create a new keybind dictionary for each keybind
                stack[-1].setdefault('m_aKeybinds', []).append(new_keybind)  # Append to m_aKeybinds list
            elif line_type == 'property':
                if isinstance(stack[-1], list):
                    # Add property to the last keybind in the list
                    stack[-1][-1][key] = value
                else:
                    stack[-1][key] = value

    return result

# Replace 'your_file_path.conf' with the actual path to your .conf file
file_path = './Editor/FM_KeybindList_Transforming.conf'
parsed_data = parse_conf_file(file_path)

json_data = json.dumps(parsed_data, indent=4)
print(json_data)

# Optionally, save the JSON to a file
json_file_path = file_path.replace('.conf', '.json')
with open(json_file_path, 'w', encoding='utf-8') as json_file:
    json_file.write(json_data)
