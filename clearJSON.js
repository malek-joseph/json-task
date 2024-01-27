const fs = require('fs');
const path = require('path');

// Specify the root directory from which you want to start deleting .json files
const rootDirectory = path.join(__dirname, '../Categories'); // Replace 'your-directory-name' with your actual directory name

// Function to recursively delete .json files in a directory and its subdirectories
function deleteJsonFiles(directory) {
    fs.readdir(directory, { withFileTypes: true }, (err, items) => {
        if (err) {
            console.error(`Could not list the directory: ${directory}`, err);
            return;
        }

        items.forEach((item) => {
            const itemPath = path.join(directory, item.name);
            if (item.isDirectory()) {
                // Recursively delete .json files in subdirectory
                deleteJsonFiles(itemPath);
            } else if (item.isFile() && path.extname(item.name) === '.json') {
                // Delete the .json file
                fs.unlink(itemPath, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${itemPath}`, err);
                    } else {
                        console.log(`Deleted file: ${itemPath}`);
                    }
                });
            }
        });
    });
}

// Start the deletion process from the root directory
deleteJsonFiles(rootDirectory);
