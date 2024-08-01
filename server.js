require("dotenv").config()
var fs = require("fs");
const path = require('path');
const express = require("express")
const app = express()
const { chromium } = require('playwright');
const { Client } = require("@notionhq/client")
const notion = new Client({ auth: process.env.NOTION_KEY })




// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"))

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html")
})

app.post("/toPdf", async function (request, response) {

  const html = request.body.htmlString;
  const fileName = request.body.fileName;
  const pathToSaves = process.env.DIR_FOR_EXPORT + "/" + fileName + ".pdf";

  fs.mkdir(path.join(__dirname, process.env.DIR_FOR_EXPORT),
    { recursive: true },
    (err) => {
        if (err) {
            return console.error(err);
        }
    });

  try 
  {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html);
    await page.pdf({ path: pathToSaves, format: 'A4', margin: { top: '1.5cm', right: '1.5cm', bottom: '2cm', left: '1.5cm' }, printBackground: true });
    await browser.close();
    response.json({ message: "Success", data: "Html convert to PDF" })
  }
  catch (e) {
    response.json({ message: "Failure", data: e })
    console.log(e);
  }
})

app.post("/getPage", async function (request, response) {

  const blockId = request.body.notionPageId;

  const page = await notion.blocks.retrieve({
    block_id: blockId,
    page_size: process.env.PAGE_SIZE,
  });

  const childrenList = await notion.blocks.children.list({
    block_id: blockId,
    page_size: process.env.PAGE_SIZE,
  });
  const changeBlocksForTextList = changeBlocksForText(page, childrenList.results)

  changeBlocksForTextList.then(
    function (value) { response.json({ message: "Success", data: value }) },
    function (error) { response.json({ message: "Failure", data: error }) }
  );
})

async function getPageChildrenById(id) {

  const blockId = id;
  const children = await notion.blocks.children.list({
    block_id: blockId,
    page_size: process.env.PAGE_SIZE,
  });

  return children.results
}

async function getPageById(id) {

  const blockId = id;
  const page = await notion.blocks.retrieve({
    block_id: blockId,
    page_size: process.env.PAGE_SIZE,
  });

  return page
}

async function changeChildrenBlocksForTextListById(id) {
  const page = await getPageById(id)
  const children = await getPageChildrenById(id)
  const changeBlocksForTextList = await changeBlocksForText(page, children)
  return changeBlocksForTextList;
}

async function changeBlocksForText(page, children, type = "page") {

  let textBlocks = []

  switch(type) {
    case "page":
      textBlocks = [["h1", page.child_page.title]]
      break
    case "toggle":
      textBlocks = [["h2", page.toggle.rich_text[0].plain_text]]
      break
    default:
      break
  }

  
  for (let i = 0; i < children.length; i++) {
    const texts = await getTextFromBlock(children[i])
    for (let j = 0; j < texts.length; j++) {
      textBlocks.push(texts[j])
    }
  }
  return textBlocks
}


const getPlainTextFromRichText = richText => {
  return richText.map(t => t.plain_text).join("")
  // Note: A page mention will return "Undefined" as the page name if the page has not been shared with the integration. See: https://developers.notion.com/reference/block#mention
}

async function getTextFromBlock(block) {
  let text

  if(block.type == "child_page") {
    return await changeChildrenBlocksForTextListById(block.id);
  }
  else if (block.type == "toggle" || block.type == "column_list" || block.type == "column") {
    const page = await getPageById(block.id);
    const childrenBlockTexts = await getPageChildrenById(block.id);
    const changeBlocksForTextList = await changeBlocksForText(page, childrenBlockTexts, block.type );
    return changeBlocksForTextList;
  } 
  

  // Check if block has rich text
  hasRichText = false;
  try {
    block[block.type].rich_text;
    hasRichText = true;
  }
  catch (e) {
    hasRichText = false;
  }


  if (hasRichText && block[block.type].rich_text) {
    text = await getTextFromRichTextBlock(block);
  }
  else {
    text = await getTextFromNonRichTextBlock(block);
  }

  htmlTag = getHtmlTagByBlockType(block.type);

  return [[htmlTag, text]];
}

function getHtmlTagByBlockType(blockType) {
  switch (blockType) {
    case "heading_1": return "h2";
    case "heading_2": return "h3";
    case "heading_3": return "h4";
    case "paragraph": return "p";
    case "bulleted_list_item": return "li";
    case "numbered_list_item": return "li";
    case "quote": return "blockquote";
    case "image": return "img";
    case "divider": return "hr";
    default: { console.log("Block type not recognized: " + blockType); return "p" };
  }
}

async function getTextFromRichTextBlock(block) {
  text = getPlainTextFromRichText(block[block.type].rich_text)
  if (text == undefined) {
    errorPage = await getPageById(block.parent.page_id)
    console.log("Page has not been shared with the integration - page title: " + errorPage.child_page.title)
    text = ""
  }
  return text
}

async function getTextFromNonRichTextBlock(block) {
  let text
  switch (block.type) {
    case "unsupported":
      // The public API does not support all block types yet
      text = "[Unsupported block type]"
      break
    case "paragraph":
      text = block.paragraph.text
      break
    case "image":
      const jsonString = JSON.stringify(block);
      const urlMatch = jsonString.match(/"url":"(.*?)"/);

      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        text = url;
      } else {
        console.log('URL not found');
      }

      break
    case "bulleted_list_item":
      text = block[block.type].text
      break
    case "numbered_list_item":
      text = block[block.type].text
      break
    case "divider":
      text = ""
      break
  }

  if (text == undefined) {
    errorPage = await getPageById(block.parent.page_id)
    console.log("type: " + block.type + " is unsupported, page title: " + errorPage.child_page.title)
    text = ""
  }

  return text;
}



// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port)
})
