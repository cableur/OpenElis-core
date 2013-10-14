if(window.Prototype) {
    delete Object.prototype.toJSON;
    delete Array.prototype.toJSON;
    delete Hash.prototype.toJSON;
    delete String.prototype.toJSON;
}

function showUserReflexChoices( index, resultId, sibIndex )
{
	var analysisElement = $("analysisId_" + index );
	var analysisId =  analysisElement ? analysisElement.value : "";
	var accessionElement = $("accessionNumberId_" + index);
	var accessionNumber = accessionElement ? accessionElement.value : "";
	var testId = $("testId_" + index ).value;

	var sibResultId = sibIndex ? $("resultId_" + sibIndex).value : null;
	var sibAnalysisId = sibIndex ? $("analysisId_" + sibIndex ).value : null;
	var sibTestId = sibIndex ? $("testId_" + sibIndex ).value : null;


//	$("userChoicePendingId_" + index).value = false;
/*	if( $("userChoicePendingId_" + sibIndex) ){
		$("userChoicePendingId_" + sibIndex).value = false;
	}
	clearReflexChoice( index );

	if( sibIndex ){
		clearReflexChoice( sibIndex );
		if(sibResultId == 0){
			return;
		}else{
			resultId += ',' + sibResultId;
			analysisId += ',' + sibAnalysisId;
			testId += ',' + sibTestId;
		}
	}
 */
	getReflexUserChoice( resultId, analysisId, testId, accessionNumber, index, processTestReflexSuccess);
}

function /*void*/ processTestReflexSuccess(xhr)
{
	//alert( xhr.responseText );
	var formField = xhr.responseXML.getElementsByTagName("formfield").item(0);
	var message = xhr.responseXML.getElementsByTagName("message").item(0);

	if (message.firstChild.nodeValue == "valid"){
        buildPopUp(formField.firstChild.textContent);
	}
}

function buildPopUp(rawResponse){
    var response = JSON.parse( rawResponse);
    var rowIndex = response["rowIndex"];
    var selections = response["selections"];
    var i, selected;

    $jq(".modal-body #testRow").val(rowIndex);
    $jq(".modal-body #targetIds").val(response["triggerIds"]);
    $jq(".modal-body #serverResponse").val( encodeJSONStringToHTML( rawResponse) );
    $jq(".selection_element").remove();
    $jq("#modal_ok").attr('disabled','disabled');
    for( i = 0; i < selections.length; i++){
        selected = jQuery.inArray(selections[i]["value"], response["selected"]) != -1;
        $jq(".modal-body").append(getSelectionRow(selections[i]["name"], selections[i]["value"], i, selected));
    }
    $jq(".modal-body #selectAll").prop('checked', false);
    $jq(".selection_element").change( function(){ checkForCheckedReflexes(); });
    $jq("#headerLabel").text(response["triggers"]);

    showReflexSelection();
}
function getSelectionRow(name, value, index, selected ){
    var check = selected ? "checked='checked' " : "";
    return "<p class='selection_element'><input style='vertical-align:text-bottom' id='selection_" +
        index + "' class='selectionCheckbox' value='" +
        value +  "' type='checkbox' " +
        check + ">&nbsp;&nbsp;&nbsp;" +
        name + "</p>";
}

function modalSelectAll(selectBox){
    if( $jq(selectBox).prop('checked')){
        $jq(selectBox).click(function(){ $jq('.selectionCheckbox').prop('checked', true); });
        $jq("#modal_ok").removeAttr('disabled');
    } else{
        $jq(selectBox).click(function(){ $jq('.selectionCheckbox').prop('checked', false); });
        $jq("#modal_ok").attr('disabled','disabled');
    }
}

function checkForCheckedReflexes(){
    if( $jq(".selectionCheckbox:checked").length == 0 ){
        $jq("#modal_ok").attr('disabled','disabled');
    }else{
        $jq("#modal_ok").removeAttr('disabled');
    }
}

function addReflexToTests( editLabel ){
    var index = $jq(".modal-body #testRow").val();
    var tests = '';
    var parentRow = $jq('#noteRow_' + index);
    var targetIds = $jq(".modal-body #targetIds" ).val();
    var popupJSONString = encodeHTMLToJSONString($jq(".modal-body #serverResponse").val());
    var popupJSONResponse = JSON.parse(popupJSONString);
    var testJSONString = encodeHTMLToJSONString( $jq("#reflexServerResultId_" + index ).val());
    var testJSONResponse = JSON.parse( testJSONString );
    var existingDisplay = $jq("#reflexSelection_" + index + "_" + targetIds );
    var selectedReflexes = [];

    $jq(".selectionCheckbox").each(function(index, value){
        if(value.checked){
            tests += $jq.trim($jq(value).parent().text()) + ", ";
            selectedReflexes.push(value.value);
        }
    });

    tests = tests.substr(0, tests.length - 2 );

    if( existingDisplay.length == 0 ){
        parentRow.after(getSelectedTestDisplay(parentRow.attr("class"), index, targetIds, $jq("#headerLabel").text().split(":")[1], tests, editLabel ));
    }else{
        existingDisplay.children().children("#reflexedTests").text(tests);
    }

    popupJSONResponse["selected"] = selectedReflexes;

    testJSONResponse[index + "_" + targetIds ] = popupJSONResponse;
    $jq("#reflexServerResultId_" + index ).val(encodeJSONStringToHTML(JSON.stringify(testJSONResponse)));

}


function getSelectedTestDisplay( classValue, index, targetIds, parent, tests, editLabel){
     return "<tr id='reflexSelection_" + index + "_" + targetIds + "' class='" + classValue + " reflexSelection_" + index + "'  >" +
        "<td colspan='5' style='text-align:right'>" + parent + "</td>" +
        "<td colspan='3'><textarea  readonly='true' id='reflexedTests' rows='2' style='width:98%' >" + tests + "</textarea></td>" +
        "<td colspan='1' style='text-align: left'><input type='button' value='" + editLabel + "' onclick=\"editReflexes('" + index + "', '" + targetIds  + "');\"></td>"
    "</tr>";
}

function removeReflexesFor( triggers, row){
    var JSONResponses = JSON.parse(encodeHTMLToJSONString( $jq("#reflexServerResultId_" + row ).val()));
    JSONResponses[row + "_" + triggers] = null;
    $jq("#reflexServerResultId_" + row ).val(encodeJSONStringToHTML(JSON.stringify(JSONResponses)));

    $jq("#reflexSelection_" + row + "_" + triggers).remove();
}

function editReflexes(index, targetIds){
    var JSONResponses = JSON.parse(encodeHTMLToJSONString( $jq("#reflexServerResultId_" + index ).val()));
    buildPopUp( JSON.stringify(JSONResponses[index + "_" + targetIds] ));
}

function showReflexSelection( element ){
    $jq('#reflexSelect').modal('show');
}

function encodeJSONStringToHTML( json){
    return json.replace( /\"/g, "'");
}

function encodeHTMLToJSONString( html ){
    return html.length == 0 ? "{}" : html.replace( /'/g, "\"");
}