// This file is run by the browser each time your view template is loaded

/**
 * Define variables that reference elements included in /views/index.html:
 */

// Forms

const getPageForm = document.getElementById("getPageForm")

// Table cells where API responses will be appended
const dbResponseEl = document.getElementById("dbResponse")
const pageResponseEl = document.getElementById("pageResponse")
const blocksResponseEl = document.getElementById("blocksResponse")
const commentResponseEl = document.getElementById("commentResponse")



/**
 * Functions to handle appending new content to /views/index.html
 */

// Appends the API response to the UI


const appendApiResponse = function (apiResponse, el) {
  console.log(apiResponse)

  // Add success message to UI
  const newParagraphSuccessMsg = document.createElement("p")
  newParagraphSuccessMsg.textContent = "Result: " + apiResponse.message
  el.appendChild(newParagraphSuccessMsg)
  // See browser console for more information
  if (apiResponse.message === "error") return

  // Add ID of Notion item (db, page, comment) to UI
  const newParagraphId = document.createElement("p")
  newParagraphId.textContent = "ID: " + apiResponse.data.id
  el.appendChild(newParagraphId)

  // Add URL of Notion item (db, page) to UI
  if (apiResponse.data.url) {
    const newAnchorTag = document.createElement("a")
    newAnchorTag.setAttribute("href", apiResponse.data.url)
    newAnchorTag.innerText = apiResponse.data.url
    el.appendChild(newAnchorTag)
  }
}

// Appends the blocks API response to the UI
const appendBlocksResponse = function (apiResponse, el) {
  console.log(apiResponse)

  // Add success message to UI
  const newParagraphSuccessMsg = document.createElement("p")
  newParagraphSuccessMsg.textContent = "Result: " + apiResponse.message
  el.appendChild(newParagraphSuccessMsg)

  // Add block ID to UI
  const newParagraphId = document.createElement("p")
  newParagraphId.textContent = "ID: " + apiResponse.data.results[0].id
  el.appendChild(newParagraphId)
}

/**
 * Attach submit event handlers to each form included in /views/index.html
 */


getPageForm.onsubmit = async function (event) {
  event.preventDefault()

  const dbName = event.target.dbName.value
  const body = JSON.stringify({ dbName })

  const newDBResponse = await fetch("/getPage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })
  const newDBData = await newDBResponse.json()
  console.log(newDBData.data);

  makeHtmlFromTexts(newDBData.data)

  var element = document.getElementById('form');
  if (element) {
      element.remove();
  }

  
  htmlString = '<!DOCTYPE html><html lang="en"><head>'+  document.head.innerHTML + '</head>'+ '<body>'+  document.body.innerHTML + '</body>'+'</html>';

  const data = JSON.stringify({htmlString});

  console.log("Length of string: " +  data.length);

  const pdfResponse = await fetch("/toPdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })

}






function addEnter(){
    const mainDiv = document.getElementById("main")
    const newParagraphSuccessMsg = document.createElement("br")
    mainDiv.appendChild(newParagraphSuccessMsg)
  
}

function makeHtmlFromTexts(texts) {

  const mainDiv = document.getElementById("main")
  textBlocks = []
  for (let i = 0; i < texts.length; i++) {
    if(texts[i]) {
      const newParagraphSuccessMsg = document.createElement(texts[i][0])
      if(texts[i][0] != "h1") {
        addEnter();
      }

  
      if(texts[1] != null) { 
        if(texts[i][0] == "img" && texts[i][1].startsWith("http")) {
          console.log(texts[i][1])
          newParagraphSuccessMsg.src = texts[i][1]
        }else {
          newParagraphSuccessMsg.textContent = texts[i][1]
        }
      } else {
        newParagraphSuccessMsg.textContent = "\n"
      }
      mainDiv.appendChild(newParagraphSuccessMsg)
    }
   
  }
  
  return textBlocks
}

// // Attach submit event to each form
// dbForm.onsubmit = async function (event) {
//   event.preventDefault()

//   const dbName = event.target.dbName.value
//   const body = JSON.stringify({ dbName })

//   const newDBResponse = await fetch("/databases", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body,
//   })
//   const newDBData = await newDBResponse.json()

//   appendApiResponse(newDBData, dbResponseEl)
// }

// pageForm.onsubmit = async function (event) {
//   event.preventDefault()

//   const dbID = event.target.newPageDB.value
//   const pageName = event.target.newPageName.value
//   const header = event.target.header.value
//   const body = JSON.stringify({ dbID, pageName, header })

//   const newPageResponse = await fetch("/pages", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body,
//   })

//   const newPageData = await newPageResponse.json()
//   appendApiResponse(newPageData, pageResponseEl)
// }

// blocksForm.onsubmit = async function (event) {
//   event.preventDefault()

//   const pageID = event.target.pageID.value
//   const content = event.target.content.value
//   const body = JSON.stringify({ pageID, content })

//   const newBlockResponse = await fetch("/blocks", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body,
//   })

//   const newBlockData = await newBlockResponse.json()
//   appendBlocksResponse(newBlockData, blocksResponseEl)
// }

// commentForm.onsubmit = async function (event) {
//   event.preventDefault()

//   const pageID = event.target.pageIDComment.value
//   const comment = event.target.comment.value
//   const body = JSON.stringify({ pageID, comment })

//   const newCommentResponse = await fetch("/comments", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body,
//   })

//   const newCommentData = await newCommentResponse.json()
//   appendApiResponse(newCommentData, commentResponseEl)
// }
