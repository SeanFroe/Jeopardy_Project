// ******************** Jeopardy API Project **********************************

const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api/";

const NUM_OF_CAT = 6;
const NUM_CLUES_PER_CAT = 5;

// Category is the main data structure, so it should look little like this:

// [
//     { title: "Dining Out"
//       clue: [
//       {question: "In Italian it's he course ordered 'before the meal', Answer: 'antipasto', showing: null"}
//       {question: "...", Answer:'...', showing: null}
// ]

//     }
// ]

let categories = [];

// Grabbing the category by ID using an async function getCategoryIds()

async function getCategoryIds() {
  let res = await axios.get(`${BASE_API_URL}categories`, {
    params: { count: 100 }, // this is how many categories are provided in the api
  });
  let catIds = res.data.map((c) => c.Id);
  return _.sampleSize(catIds, NUM_OF_CAT); // the "-"(lodash) is used to select a specified number of elements, in this case my array in the Catergories.
}

//  Return catagories by clues: should give an object like this:
//
// Return { title: "Dining Out", clues: clue-array}
// [
// {question: "...", Answer: "...", Showing: null}
// {question: "...", Answer: "...", Showing: null}

async function getCategory(catId) {
  let res = await axios.get(`${BASE_API_URL}category`, {
    params: { id: catId },
  });

  let cat = res.data;
  let randoClues = _.sampleSize(cat.clues, NUM_CLUES_PER_CAT).map((c) => ({
    question: c.question,
    answer: c.answer,
    showing: null,
  }));
  return { title: cat.title, clues: randoClues };
}

// Fill in HTML table '#jepordy' with the catergories and question cells.

// The <thead> should be filled with a <tr> and in that a <td> for each catergory
// The <tbody> should be filled with the NUM_QUESTIONS_PER_CAT these are in <tr>s,
// and each should be filled with a question for each category <td>
//  show a "?" where each question in a cell should go

async function fillTable() {
  hideLoadingView();

  //   Add row for each category
  let $tr = $("<tr>");
  for (let category of categories) {
    $tr.append($("<th>")).text(category.title);
  }
  $("#jeopardy thead").append($tr);

  //   add rows with questions as the category
  $("#jeopardy tbody").empty();
  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_OF_CAT; catIdx++) {
      $tr.append(
        $("<td>")
          .attr("id", `${catIdx}-${clueIdx}`)
          .append($("<i>").addClass("fas fa-question-circle fa-3x"))
      );
    }
    $("#jeopardy tbody").append($tr);
  }
}

// ** Handle clicking on a clue: show the question or answer.
//  *
//  * Uses .showing property on clue to determine what to show:
//  * - if currently null, show question & set .showing to "question"
//  * - if currently "question", show answer & set .showing to "answer"
//  * - if currently "answer", ignore click
//  * */

function handleClick(evt) {
  let $tgt = $(evt.target);
  let id = $tgt.attr("id");
  let [catId, clueId] = id.split("-");
  let clue = categories[catId].clues[clueId];

  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
    $tgt.addClass("disabled");
  } else {
    // if answer is showing ignore
    return;
  }
  // this updates text of cell
  $tgt.html(msg);
}

//  Now clear out loading board, show loading spinner,
//  and update the button to fetch data.

function showLoadingView() {
  // clear the board
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();

  // show loading Icon
  $("#spin-container").show();
  $("#start").addClass("disabled").text("Loading...");
}

// hideLoadingView() Removes loading spinner and fetches update data
async function hideLoadingView() {
  $("#start").removeClass("disabled").text("Restart!");
  $("#spin-container").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  let isLoading = $("#start").text() === "Loading...";

  if (!isLoading) {
    showLoadingView();

    let catIds = await getCategoryIds();

    catagories = [];

    for (let catId of catIds) {
      categories.push(await getCategory(catId));
    }

    fillTable();
  }
}

/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function () {
  $("#jeopardy").on("click", "td", handleClick);
});
