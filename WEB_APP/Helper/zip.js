const archiver = require('archiver');
const { getCourseStructureByPart } = require('./course_partitioning')
const fs = require("fs");
const path = require("path");

async function createCourseZip(courseStructure, partNumber) {
  console.log(courseStructure.documents)
  let zipFileName = `course_${courseStructure._id}_part_${partNumber}.zip`;
  let rootFolder = path.join(process.cwd().toString(), "uploads", courseStructure._id.toString());
  let zipFilePath = path.join(rootFolder, zipFileName);

  try {
    // Asynchronously check if the file exists
    await fs.promises.access(zipFilePath, fs.constants.F_OK);
    console.log(`ZIP file already exists: ${zipFileName}`);
    return zipFileName; // Return the existing ZIP file path
  } catch (error) {
    if (error.code == 'ENOENT') {
      // File doesn't exist, proceed with creating the ZIP
      let archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });
      // create a file to stream archive data to.
      const output = fs.createWriteStream(path.join(rootFolder, zipFileName));
      output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
      });
      output.on('end', function() {
        console.log('Data has been drained');
      });
      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          console.log(err);
        } else {
          
          throw err;
        }
      });
      archive.on('error', function(err) {
        throw err;
      });
      // Create a directory for media within the ZIP
      archive.pipe(output);
      archive.directory('media');

      // Add the JSON to the archive
      let json_data = JSON.stringify(courseStructure);
      archive.append(json_data, { name: 'course_structure.json' });

      // Asynchronously add media files to the archive while streaming
      await loadMediaRecursively(courseStructure,archive)
      await archive.finalize();

      return zipFileName;
    } else {
      throw error; // Handle other errors
    }
  }
}

async  function loadMediaRecursively(courseStructure,archive){
  for ( let document of courseStructure.documents ) {
    for (let section of document.sections) {
      console.log(section)
      if (section.type === "Image" || section.type === "Video") {
        console.log('loading')
        await addMediaToArchive(archive, section);
      }
    }}
    

    for (const subdir of courseStructure.subdirs) {
      await loadMediaRecursively(subdir ,archive);
      
    }
  
}
async function addMediaToArchive(archive, section) {

  try {
    const stream = fs.createReadStream(section.address);
    console.log(stream)
    const fullpath  = section.address.split('/');
    const name  = fullpath[fullpath.length - 1];
    console.log(name)
    archive.append(stream, { name: 'media/'+name}); // Keep the original address
    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('end', resolve);
    });
  } catch (error) {
    console.error(`Error retrieving media for section ${section.name}:`, error);
  }

}
exports.createPartZip = createCourseZip;