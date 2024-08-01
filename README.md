This a simple web app that converts notion page (with subpages) to html and pdf.
App is base on one of demo from notion api documentation.


### Notion setup
To do that you need to setup notion. This is easy expalained on this page https://developers.notion.com/docs/create-a-notion-integration.

After that you need to setup local application. 

### App installing
# Clone this repository locally
git clone https://github.com/MateuszPietrych/NotionToHtmlAndPdf

# Switch into this project
cd NotionToHtmlAndPdf

# Install the dependencies
npm install

### Configuaration and usage

A `.env.example` file has been included and need to be renamed `.env`, and configured.

NOTION_KEY - create a new integration in the [integrations dashboard](https://www.notion.com/my-integrations) and retrieve the API key from the integration's `Secrets` page. You get that from linked site
NOTION_PAGE_ID - use the ID of any Notion page you want to add databases to. This page will be the parent of all content created through this integration. By example, from this link for notion page 'https://www.notion.so/RPG-Campaign-6ff15e43332d4c6bb28f1e18ab33ak43' get only '6ff15e43332d4c6bb28f1e18ab33ak43'
PORT - port
DIR_FOR_EXPORT - name for folder with exported pdf files
PAGE_SIZE - how much content from one page it should take (number of blocks, where block is paragraph, heading etc)


After that setup start server by 'node server.js' commend and go to page 'http://localhost:<PORT>/'.

Fill two fields:
Notion Page ID - by example, from this link for notion page 'https://www.notion.so/RPG-Campaign-6ff15e43332d4c6bb28f1e18ab33ak43' get only '6ff15e43332d4c6bb28f1e18ab33ak43'
Export File Name - name for pdf export file, use just name without '.pdf' ending

After sometime, app will show html version on website, and export pdf to created folder.


### File structure

On the frontend, this app includes:

- `views/index.html`, which represents the app's webpage content. Users will interact with the HTML elements in this page. It also contain styles in header, because pdf converter works better with it.
- `public/client.js`, the client-side JavaScript added to handle HTML form `submit` events.


On the backend, this app includes:

- `server.js`, which serves `index.html` and defines the endpoints used in the client-side JS code. All Notion public API usage (Notion SDK for JavaScript) is included in this file.
