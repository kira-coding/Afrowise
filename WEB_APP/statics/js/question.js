/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const question_container = document.getElementById("question_container")
let selected = ''
let counter = 1
let counter2 = 1
setInterval(() => {
  let type = document.getElementById('type').value
  if (type == selected);
  else if (type == "multipleChoice") {
    question_container.innerHTML = `

            <span>correct choice</span>
            <input type="text" id="correct_choice">
            <br>
            <span>other choices</span>
            <div id = "append">
            <span> choice 1 </span>
            
            <input type="text" name="incorrect" class="choices"></div>
            <button type="button" onclick="addChoice()"> Add choice</button>
        `

    selected = "multipleChoice"
    counter = 1;
  }
  else if (type == 'multipleAnswer') {
    question_container.innerHTML = `
        <span>correct answers</span>
          <hr>
        <div id="appendAnswer">
          <span>1.</span>
          <input type="text" name="correct"class="answer">
        </div> 
        <button type="button" onclick="addAnswer()">Add correct answer</button> 
        <hr> 
        <span> incorrect answers</span> 
        <hr> 
        <div id = "appendIncorrect">
          <span>1.</span> 
          <input type=" text"name="incorrect" class="incorrectAnswer">
        </div>

        <button type="button" onclick="addIncorrectAnswer()" >Add incorrect answer</button>`
    selected = "multipleAnswer"
    counter2 = 1

  }
  else if (type == 'matching') {
    question_container.innerHTML = `
        <table>
                <thead>
                    <tr>
                        <th>first column</th>
                        <th>second column </th>
                    </tr>
                </thead>
                <tbody id="appendrow">
                    <tr class="item">
                        <td>
                            <input type="text" class="one">
                        </td>
                        <td>
                            <input type="text" class="two">
                        </td>
                    </tr>
                    <tr class="item">
                        <td>
                            <input type="text" class="one">
                        </td>
                        <td>
                            <input type="text" class="two">
                        </td>
                    </tr>
                      
                </tbody>

            </table>
            <button type="button" onclick="addRow()">Add a match</button>

        `
    selected = "matching"
  }
  else if (type == "order") {
    question_container.innerHTML = `
       <p>Add the elements in there correct order please</p>
<div class="appendNext">
            <span>1.</span><input type="text" class="ordered">
            <br>
            <span>2.</span><input type="text" class="ordered">
            </div>
            <button type="button" onclick="addNext()"> Add the next  </button>
       `
    selected = "order"
  }
}, 300)
function addChoice() {
  let element = $('#append')
  counter++
  let element_to_append = $(` <br> <span> choice ${counter} </span>
            
            <input type="text" name="incorrect" class="choices">`)
  element.append(element_to_append)


}

function addAnswer() {
  let element = $('#appendAnswer')
  counter++
  let element_to_append = $(`
<br>
            <span>${counter}.</span><input type="text" name="correct"class="answer">
        `)
  element.append(element_to_append)
}

function addIncorrectAnswer() {
  let element = $('#appendIncorrect')
  counter2++
  let element_to_append = $(`
<br><span>${counter2}.</span><input type="text" name="correct" class="incorrectAnswer">
 `)
  element.append(element_to_append)

}
function addRow() {
  let element = $("#appendrow")
  let element_to_append = $(`
                     <tr class="item">
                        <td>
                            <input type="text" class="one">
                        </td>
                        <td><input type="text" class="two"></td>
                    </tr>             

`)
  element.append(element_to_append)
}
function addNext() {

  counter++
  let element = $("#appendNext")
  let element_to_append = $(`

            <span>${counter}.</span><input type="text" class="ordered">
`)

  element.append(element_to_append)
}

