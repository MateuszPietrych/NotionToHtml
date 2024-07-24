require("dotenv").config()
const express = require("express")
const app = express()

const { Client } = require("@notionhq/client")
const notion = new Client({ auth: process.env.NOTION_KEY })


// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"))
app.use(express.json()) // for parsing application/json

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html")
})



app.post("/getPage",  async function (request, response) {

  const blockId = request.body.dbName;

  const page = await notion.blocks.retrieve({
    block_id: blockId,
    page_size: 50,
  });

  const childrenList = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 50,
  });
  //console.log(requestResponse);
  //printBlockText(requestResponse.results)
  const changeBlocksForTextList = changeBlocksForText(page, childrenList.results)
 

  changeBlocksForTextList.then(
    function(value) { response.json({message: "success!", data:  value})},
    function(error) { response.json({message: "fail!", data:  error}) }
  );
}) 

async function getPageChildrenById(id) {
  console.log("Retrieving page (async)...")
  
  const blockId = id;
  const children = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 50,
  });

  return children.results
}

async function getPageById(id) {
  console.log("Retrieving page (async)...")
  
  const blockId = id;
  const page = await notion.blocks.retrieve({
    block_id: blockId,
    page_size: 50,
  });

  return page
}

async function changeChildrenBlocksForTextListById(id) {
  const page = await getPageById(id)
  const children = await getPageChildrenById(id)
  const changeBlocksForTextList = await changeBlocksForText(page, children)
  return changeBlocksForTextList;
}




// app.post("/getPage",  async function (request, response) {

//   const blockId = request.body.dbName;
//   const requestResponse = await notion.blocks.retrieve({
//     block_id: blockId,
//   });
//   console.log(requestResponse);

//   response.json({message: "success!", data: requestResponse })
// })
const getPlainTextFromRichText = richText => {
  return richText.map(t => t.plain_text).join("")
  // Note: A page mention will return "Undefined" as the page name if the page has not been shared with the integration. See: https://developers.notion.com/reference/block#mention
}

async function getTextFromBlock (block){
  let text

  // Get rich text from blocks that support it
  

  hasRichText = false;
  try{
    block[block.type].rich_text;
    hasRichText = true;
  }
  catch(e){
    hasRichText = false;
  }

  // console.log("\n\nblock: " + JSON.stringify(block))
  

  if (hasRichText && block[block.type].rich_text) {
    if(block.type == "toggle"){
      // console.log("\n\nblock: " + JSON.stringify(block))
      const page = await getPageById(block.id);
      const childrenBlockTexts = await getPageChildrenById(block.id);
      const changeBlocksForTextList = await changeBlocksForText(page, childrenBlockTexts, true);
      console.log(changeBlocksForTextList);
      return changeBlocksForTextList;
    }
    // This will be an empty string if it's an empty line.
    text = getPlainTextFromRichText(block[block.type].rich_text)
    console.log("Block type: " + block.type + "  -  " + text)

  }
  // Get text for block types that don't have rich text
  else {

    switch (block.type) {
      case "unsupported":
        // The public API does not support all block types yet
        text = "[Unsupported block type]"
        break
      case "paragraph":
        text = block.paragraph.text
        break
      case "bookmark":
        text = block.bookmark.url
        break
      case "child_database":
        //text = block.child_database.title
        text = "child_database ----------------------------------------------"

        // Use "Query a database" endpoint to get db rows: https://developers.notion.com/reference/post-database-query
        // Use "Retrieve a database" endpoint to get additional properties: https://developers.notion.com/reference/retrieve-a-database
        break
      case "child_page":
        return await changeChildrenBlocksForTextListById(block.id);
      case "embed":
      case "video":
      case "file":
      case "image":
      case "quote":
      case "bulleted_list_item":
        // console.log(block)
        text = block[block.type].text
        break
      case "numbered_list_item":
        text = block[block.type].text
        break
      case "pdf":
        //text = getMediaSourceText(block)
        break
      case "equation":
        text = block.equation.expression
        break
      case "link_preview":
        text = block.link_preview.url
        break
      case "synced_block":
        // Provides ID for block it's synced with.
        text = block.synced_block.synced_from
          ? "This block is synced with a block with the following ID: " +
            block.synced_block.synced_from[block.synced_block.synced_from.type]
          : "Source sync block that another blocked is synced with."
        break
      case "table":
        // Only contains table properties.
        // Fetch children blocks for more details.
        text = "Table width: " + block.table.table_width
        break
      case "table_of_contents":
        // Does not include text from ToC; just the color
        text = "ToC color: " + block.table_of_contents.color
        break
      case "breadcrumb":
      case "column_list":
      case "divider":
        text = "No text available"
        break
      default:
        console.log("Default block: " + block)
        text = "[Needs case added]"
        break
    }
  }


  switch(block.type){
    case "heading_1": return [["h2", text]];
    case "heading_2": return [["h3", text]];
    case "heading_3": return [["h4", text]];
    case "paragraph": return [["p", text]];
    case "bulleted_list_item": return [["li", text]];
    case "numbered_list_item": return [["li", text]];
    case "quote": return [["blockquote", text]];
    default: {console.log(block.type + "  -  " + text); return ["p", text]};
  }

}

async function retrieveBlockChildren(id) {
  console.log("Retrieving blocks (async)...")
  const blocks = []

  // Use iteratePaginatedAPI helper function to get all blocks first-level blocks on the page
  for await (const block of iteratePaginatedAPI(notion.blocks.children.list, {
    block_id: id, // A page ID can be passed as a block ID: https://developers.notion.com/docs/working-with-page-content#modeling-content-as-blocks
  })) {
    blocks.push(block)
  }

  return blocks
}

function getBlockById(id) {
  return notion.blocks.retrieve({ block_id: id })
}



// const printBlockText = blocks => {
//   console.log("Displaying blocks:")

//   for (let i = 0; i < blocks.length; i++) {
//     const text = getTextFromBlock(blocks[i])
//     // Print plain text for each block.
//     console.log(text)
//   }
// }

async function changeBlocksForText(page, children, isToggle = false) {

  let textBlocks = []
  if(!isToggle)
  {
    textBlocks = [["h1", page.child_page.title]]
  }else
  {
    console.log(JSON.stringify(page))
    textBlocks = [["h2", page.toggle.rich_text[0].plain_text]]
  }
  
  for (let i = 0; i < children.length; i++) {
    const texts = await getTextFromBlock(children[i])
    for(let j = 0; j < texts.length; j++){
      textBlocks.push(texts[j])
    }
  }
  // console.log(textBlocks)
  
  return textBlocks
}

// function prepareTexts(texts){

//   preparedTextList = []
//   for(let i = 0; i < texts.length; i++){
//     const text = texts[i]
//     const splitIndex =  text.search(":")

//     const splitTextArray = [text.slice(0, splitIndex), text.slice(splitIndex+1)]

//     console.log(splitTextArray)
//     preparedTextList.push(splitTextArray)
//   }
//   return preparedTextList
// }


// function makeHtmlFromTexts(texts) {

//   const mainDiv = document.getElementById("test")
//   textBlocks = []
//   for (let i = 0; i < blocks.length; i++) {
//     const text = getTextFromBlock(blocks[i])
//     textBlocks.push(text)
//     // Print plain text for each block.


//     const newParagraphSuccessMsg = document.createElement("p")
//     newParagraphSuccessMsg.textContent = text
//     mainDiv.appendChild(newParagraphSuccessMsg)
//   }
  
//   return textBlocks
// }

function chooseElementFromText(text){
  switch(text){
    case "heading_1": return "h1";
    case "heading_2": return "h2";
    case "heading_3": return "h3";
    case "paragraph": return "p";
  }
}






















// Create new database. The page ID is set in the environment variables.
app.post("/databases", async function (request, response) {
  const pageId = process.env.NOTION_PAGE_ID
  const title = request.body.dbName

  console.log("NOTION_PAGE_ID: %s", pageId)
  console.log("NOTION_KEY: %s", process.env.NOTION_KEY)

  try {
    const newDb = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: pageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: title,
          },
        },
      ],
      properties: {
        Name: {
          title: {},
        },
      },
    })
    response.json({ message: "success!", data: newDb })
  } catch (error) {
    response.json({ message: "error", error })
  }
})

// Create new page. The database ID is provided in the web form.
app.post("/pages", async function (request, response) {
  const { dbID, pageName, header } = request.body

  try {
    const newPage = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: dbID,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: pageName,
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          heading_2: {
            rich_text: [
              {
                text: {
                  content: header,
                },
              },
            ],
          },
        },
      ],
    })
    response.json({ message: "success!", data: newPage })
  } catch (error) {
    response.json({ message: "error", error })
  }
})

// Create new block (page content). The page ID is provided in the web form.
app.post("/blocks", async function (request, response) {
  const { pageID, content } = request.body

  try {
    const newBlock = await notion.blocks.children.append({
      block_id: pageID, // a block ID can be a page ID
      children: [
        {
          // Use a paragraph as a default but the form or request can be updated to allow for other block types: https://developers.notion.com/reference/block#keys
          paragraph: {
            rich_text: [
              {
                text: {
                  content: content,
                },
              },
            ],
          },
        },
      ],
    })
    response.json({ message: "success!", data: newBlock })
  } catch (error) {
    response.json({ message: "error", error })
  }
})

// Create new page comments. The page ID is provided in the web form.
app.post("/comments", async function (request, response) {
  const { pageID, comment } = request.body

  try {
    const newComment = await notion.comments.create({
      parent: {
        page_id: pageID,
      },
      rich_text: [
        {
          text: {
            content: comment,
          },
        },
      ],
    })
    response.json({ message: "success!", data: newComment })
  } catch (error) {
    response.json({ message: "error", error })
  }
})

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port)
})
