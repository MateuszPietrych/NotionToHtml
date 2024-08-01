
const getPageForm = document.getElementById("getPageForm")


getPageForm.onsubmit = async function (event) {
  event.preventDefault()

  const notionPageId = event.target.notionPageId.value
  const fileName = event.target.fileName.value
  
  await createHtmlFromNotionPage(notionPageId)

  deleteElement("mainForm")

  await createPdfFileFromtHtml(fileName)
}

async function createHtmlFromNotionPage(notionPageId) {
  const body = JSON.stringify({ notionPageId: notionPageId })

  const getPageResponse = await fetch("/getPage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  })
  const getPageResponseData = await getPageResponse.json()

  makeHtmlFromTexts(getPageResponseData.data)
}

async function createPdfFileFromtHtml(fileName, htmlString = null) {
  if(htmlString == null){
    htmlString = '<!DOCTYPE html><html lang="en"><head>' + document.head.innerHTML + '</head>' + '<body>' + document.body.innerHTML + '</body>' + '</html>';
  }
  const data = JSON.stringify({ htmlString, fileName });

  const toPdfResponse = await fetch("/toPdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })

  const toPdfResponseData = await toPdfResponse.json()
  console.log(toPdfResponseData)
}

function deleteElement(elementName) {
  var element = document.getElementById(elementName);
  if (element) {
    element.remove();
  }
}


function addEnter() {
  const mainDiv = document.getElementById("main")
  const newParagraphSuccessMsg = document.createElement("br")
  mainDiv.appendChild(newParagraphSuccessMsg)
}

function makeHtmlFromTexts(texts) {

  const mainDiv = document.getElementById("main")
  textBlocks = []
  for (let i = 0; i < texts.length; i++) {
    if (texts[i]) {
      const newParagraphSuccessMsg = document.createElement(texts[i][0])
      if (texts[i][0] != "h1") {
        addEnter();
      }

      if (texts[1] != null) {
        if (texts[i][0] == "img" && texts[i][1].startsWith("http")) {
          newParagraphSuccessMsg.src = texts[i][1]
        } else {
          newParagraphSuccessMsg.textContent = texts[i][1]
        }
      } else {
        newParagraphSuccessMsg.textContent = "\n"
      }
      newParagraphSuccessMsg.align = "justify"
      mainDiv.appendChild(newParagraphSuccessMsg)
    }
  }

  return textBlocks
}


