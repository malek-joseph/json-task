const fs = require('fs');
const path = require('path');

// Define the root folder path for processing .conf files
const rootFolderPath = path.resolve(__dirname, '../Categories'); // Adjust the path as needed

// Function to parse a single line of the .conf content
function parseConfLine(line) {
    line = line.trim();
    if (!line || line.startsWith('//')) return { type: null }; // Skip empty lines and comments

    if (line.endsWith('{')) {
        const sectionOrKeybindMatch = line.match(/^(\w+)(?:\s+"{([^}"]+)}")?\s*\{/);
        if (sectionOrKeybindMatch) {
            return { type: 'section_start', key: sectionOrKeybindMatch[1], id: sectionOrKeybindMatch[2] || null };
        }
    } else if (line === '}') {
        return { type: 'section_end' };
    } else {
        const propertyMatch = line.match(/^(\w+)\s+"((?:\\.|[^"\\])*)"/); // Correctly handle escaped quotes
        if (propertyMatch) {
            const [, key, value] = propertyMatch;
            return { type: 'property', key, value };
        }
    }

    return { type: 'unknown' };
}

// Function to parse the entire .conf content
function parseConfFile(content) {
    const lines = content.split(/\r?\n/);
    let rootSection = {}; // Initialize the root section
    let stack = [{current: rootSection}]; // Stack with a wrapper for the root section

    lines.forEach(line => {
        const { type, key, value } = parseConfLine(line);

        // Check if the stack is not empty before accessing the top element
        if (stack.length === 0) {
            console.error("Error: Stack is empty. This should not happen.");
            return; // Skip processing this line to avoid further errors
        }

        let stackTop = stack[stack.length - 1]; // Get the top element of the stack

        switch (type) {
            case 'section_start':
                const newSection = {}; // Create a new section
                if (!stackTop.current[key]) {
                    stackTop.current[key] = [newSection]; // Initialize with new section if key doesn't exist
                } else {
                    stackTop.current[key].push(newSection); // Append to existing array if key exists
                }
                stack.push({current: newSection}); // Push the new section onto the stack
                break;
            case 'section_end':
                stack.pop(); // Remove the current section from the stack
                break;
            case 'property':
                stackTop.current[key] = value; // Set the property on the current section
                break;
            // Handle 'unknown' type or add logging for unexpected cases
        }
    });

    // Return the root section, which now contains the parsed structure
    return rootSection;
}



// Function to process a single .conf file
function processConfFile(filePath) {
    fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
        if (err) {
            console.error(`Error reading the .conf file: ${filePath}`, err);
            return;
        }

        const parsedData = parseConfFile(data); // Use the parseConfFile function to parse file content
        const jsonFilePath = filePath.replace('.conf', '.json'); // Construct the output JSON file path

        fs.writeFile(jsonFilePath, JSON.stringify(parsedData, null, 2), (err) => {
            if (err) {
                console.error(`Error writing the JSON file: ${jsonFilePath}`, err);
            } else {
                console.log(`JSON file was successfully written to ${jsonFilePath}`);
            }
        });
    });
}

// Function to recursively read through directories and find .conf files
function readDirectory(directoryPath) {
    fs.readdir(directoryPath, { withFileTypes: true }, (err, items) => {
        if (err) {
            console.error(`Error reading directory: ${directoryPath}`, err);
            return;
        }

        items.forEach(item => {
            const itemPath = path.join(directoryPath, item.name);
            if (item.isDirectory()) {
                readDirectory(itemPath); // Recursively read subdirectories
            } else if (item.isFile() && item.name.endsWith('.conf')) {
                processConfFile(itemPath); // Process .conf files
            }
        });
    });
}

// Start processing from the root folder
readDirectory(rootFolderPath);
