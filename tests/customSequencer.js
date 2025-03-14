const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define the exact order of test files
    const testOrder = [
      'staticRoutes.test.ts',
      'customerdogs.test.ts',
      'appointments.test.ts',
      'generic.test.ts',
      // Add any other test files here in the order you want them to run
    ];

    return Array.from(tests).sort((testA, testB) => {
      const fileNameA = path.basename(testA.path);
      const fileNameB = path.basename(testB.path);
      
      // Get the index of each file in our ordered list
      const indexA = testOrder.findIndex(name => fileNameA.includes(name));
      const indexB = testOrder.findIndex(name => fileNameB.includes(name));
      
      // If both files are in our list, sort by their position in the list
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one file is in our list, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // For files not in our list, maintain alphabetical order
      return fileNameA.localeCompare(fileNameB);
    });
  }
}

module.exports = CustomSequencer; 