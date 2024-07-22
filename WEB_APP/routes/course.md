# Create folder (POST /folders)
Requires name and parent (folder ID) in request body.
Creates a new Folder document with the provided details.
Updates the parent folder to include the new subfolder's ID in its subdirs array.
# Get all folders (GET /folders)
Retrieves all Folder documents, populating subdirs and documents for nested structures.
# Get a specific folder (GET /folders/:id)
Retrieves a specific Folder document with populated subdirs and documents for nested data.
Processes the order array to construct the content list, differentiating folders and documents.
# Update a folder (PUT /folder/:id)
Updates the name of a folder based on the provided request body.
Delete a folder (POST /folders/delete/:id)
Calls the deleteFolderRecursively function to efficiently delete the folder and its subdocuments.
Redirects to the parent folder view after deletion.
# Documents:

# Create document (POST /document)
Requires name and parent (folder ID) in request body.
Creates a new Document document with the provided details.
Updates the parent folder to include the new document's ID in its documents array.
# Get all documents (GET /document)
Retrieves all Document documents, populating sections for associated sections.
Get a specific document (GET /document/:id)
Retrieves a specific Document document, populating sections for associated sections.
Renders the courses/document.ejs template with the document details.
# Update a document (PUT /document/:id)
Updates the name of a document based on the provided request body.
# Delete a document (POST /document/delete/:id)
Calls the deleteDocument function to delete the document and its associated sections.
Handles both AJAX requests (returning JSON) and standard requests (redirecting back to the parent folder view).
Text Sections:

# Update a text section (POST /text)
Requires id (section ID), content, and name in request body.
Updates the content and name of a text section (type="Text") in the Section collection.
Handles both AJAX requests (returning JSON) and standard requests (redirecting back to the text editing view).
# Get a specific text section (GET /document/:id/text/:id2)
Retrieves a specific text section within a document, populates the document information.
Renders the courses/edit_text.ejs template for editing the text section.
Sections (General):

# Get a specific section (GET /section/:id)
Retrieves a specific Section document, populating the document.
Renders different templates (courses/text, courses/image, courses/video) based on the section type.
Images and Videos:

# Create image/video section (POST /section)
Requires type ("Image" or "Video") and documentId in request body.
Handles file uploads using express-fileupload.
Creates a new Section document with the uploaded file path and document association.
Updates the parent document to include the new section's ID in its sections array.
# Get a specific image section (GET /image/:id)
Retrieves an image section, reads the image file, and renders the courses/image.ejs template with encoded image data.
# Get a specific video section (GET /video/:id)
Retrieves
