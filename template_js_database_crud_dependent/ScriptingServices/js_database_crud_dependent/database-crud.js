/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');
var ${fileNameNoExtension}Dao = require('${packageName}/${fileNameNoExtension}Dao');


handleRequest(request, response, xss);

function handleRequest(httpRequest, httpResponse, xss) {
	try {
		dispatchRequest(httpRequest, httpResponse, xss);
	} catch (e) {
		console.error(e);
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'text/plain', e);
	}
}

function dispatchRequest(httpRequest, httpResponse, xss) {
	response.setContentType('application/json; charset=UTF-8');
	response.setCharacterEncoding('UTF-8');

	switch (httpRequest.getMethod()) {
		case 'GET':
			handleGetRequest(httpRequest, httpResponse, xss);
			break;
		case 'POST': 
			handlePostRequest(httpRequest, httpResponse);
			break;
		case 'PUT':
			handlePutRequest(httpRequest, httpResponse);
			break;
		case 'DELETE':
			handleDeleteRequest(httpRequest, httpResponse, xss);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handleGetRequest(httpRequest, httpResponse, xss) {
	var id = getIdParameter(httpRequest, xss);
	var count = xss.escapeSql(httpRequest.getParameter('count'));
	var metadata = xss.escapeSql(httpRequest.getParameter('metadata'));
	var limit = xss.escapeSql(httpRequest.getParameter('limit'));
	var offset = xss.escapeSql(httpRequest.getParameter('offset'));
	var sort = xss.escapeSql(httpRequest.getParameter('sort'));
	var desc = xss.escapeSql(httpRequest.getParameter('desc'));
	var desc = xss.escapeSql(httpRequest.getParameter('desc'));
	var ${dependentColumn.toLowerCase()} = xss.escapeSql(httpRequest.getParameter('${dependentColumn.toLowerCase()}'));

	limit = limit ? limit : 100;
	offset = offset ? offset : 0;

	if (!hasConflictingParameters(id, count, metadata, httpResponse)) {
		if (id) {
			var entity = ${fileNameNoExtension}Dao.get(id);
			if (entity !== null) {
				sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(entity, null, 2));
			} else {
				sendResponse(httpResponse, httpResponse.NOT_FOUND, 'text/plain', 'No entity found with \'#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end\'=' + id);
			}
		} else if (count !== null) {
			var ${fileNameNoExtension}Count = ${fileNameNoExtension}Dao.count(${dependentColumn.toLowerCase()});
			sendResponse(httpResponse, httpResponse.OK, 'text/plain', ${fileNameNoExtension}Count);
		} else if (metadata !== null) {
			var ${fileNameNoExtension}Metadata = ${fileNameNoExtension}Dao.metadata();
			sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(${fileNameNoExtension}Metadata, null, 2));
		} else {
			var ${fileNameNoExtension} = ${fileNameNoExtension}Dao.list(limit, offset, sort, desc, ${dependentColumn.toLowerCase()});
			sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(${fileNameNoExtension}, null, 2));
		}
	}
}

function handlePostRequest(httpRequest, httpResponse) {
	var entity = getRequestBody(httpRequest);
	var id = ${fileNameNoExtension}Dao.create(entity);
	sendResponse(httpResponse, httpResponse.CREATED, 'text/plain', id);
}

function handlePutRequest(httpRequest, httpResponse) {
	var entity = getRequestBody(httpRequest);
	var id = getIdParameter(httpRequest, xss);
	id = id !== null ? id : entity.#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end;
	if (id !== null) {
		if (${fileNameNoExtension}Dao.get(id) !== null) {
			${fileNameNoExtension}Dao.update(entity);
			sendResponse(httpResponse, httpResponse.NO_CONTENT);
		} else {
			sendResponse(httpResponse, httpResponse.NOT_FOUND, 'text/plain', 'No entity found with \'#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end\'=' + id);
		}
	} else {
		sendResponse(httpResponse, httpResponse.PRECONDITION_FAILED, 'text/plain', 'Expected \'#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end\' parameter is missing!');
	}

}

function handleDeleteRequest(httpRequest, httpResponse, xss) {
	var id = getIdParameter(httpRequest, xss);
	if (id !== null) {
		var entity = ${fileNameNoExtension}Dao.get(id);
		if (entity !== null) {
			${fileNameNoExtension}Dao.delete(entity);
			sendResponse(httpResponse, httpResponse.NO_CONTENT);
		} else {
			sendResponse(httpResponse, httpResponse.NOT_FOUND, 'text/plain', 'No entity found with \'#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end\'=' + id);
		}
	} else {
		sendResponse(httpResponse, httpResponse.PRECONDITION_FAILED, 'text/plain', 'Expected \'#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end\' parameter is missing!');
	}
}

function handleNotAllowedRequest(httpResponse) {
	sendResponse(httpResponse, httpResponse.METHOD_NOT_ALLOWED);
}

// Retrieve the Id parameter
function getIdParameter(httpRequest, xss) {
	var id = xss.escapeSql(httpRequest.getAttribute('path'));
	id = id !== null ? id : xss.escapeSql(httpRequest.getParameter('#foreach ($tableColumn in $tableColumns)#if ($tableColumn.isKey())${tableColumn.getName().toLowerCase()}#end#end'));
	return id;
}

function hasConflictingParameters(id, count, metadata, httpResponse) {
	var result = false;
    if (id !== null && count !== null) {
    	sendResponse(httpResponse, httpResponse.EXPECTATION_FAILED, 'text/plain', 'Expectation failed: conflicting parameters - id, count');
        result = true;
    } else if (id !== null && metadata !== null) {
    	sendResponse(httpResponse, httpResponse.EXPECTATION_FAILED, 'text/plain', 'Expectation failed: conflicting parameters - id, metadata');
        result = true;
    } else if (count !== null && metadata !== null) {
    	sendResponse(httpResponse, httpResponse.EXPECTATION_FAILED, 'text/plain', 'Expectation failed: conflicting parameters - count, metadata');
        result = true;
	}
    return result;
}

function getRequestBody(httpRequest) {
	try {
		return JSON.parse(httpRequest.readInputText());
	} catch (e) {
		return null;
	}
}

function sendResponse(response, status, contentType, content) {
	response.setStatus(status);
	response.setContentType(contentType);
	response.println(content);
	response.flush();
	response.close();	
}
