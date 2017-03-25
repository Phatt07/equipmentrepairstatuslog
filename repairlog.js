var app = angular.module('repairApp', ['ngSanitize','spNgModule','ui.router', 'angular.filter','ui.bootstrap'/*, 'ngIdle', 'ngCapsLock'*/]);

app.constant("IS_APP_WEB", true);

var weburl = _spPageContextInfo.webServerRelativeUrl.replace(/\/$/g,'');
var contexturl = weburl + "/_api/ContextInfo";
var sender = _spPageContextInfo.userLoginName.split("@")[0];
var protocol = window.location.protocol;
var endpoint = '//clydewap.clydeinc.com/webservices/json/ClydeWebServices/';

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    } 
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
//config
app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider){
	$httpProvider.defaults.withCredentials = true;
	$urlRouterProvider.otherwise('/list'); 
	$stateProvider
		.state('list', {
				url: '/list',
				templateUrl: "/apps/SiteAssets/html/apps/equipmentrepairlog/views/view-list.html",
				controller: 'listController'
		})
		.state('create', {
			url: '/create',
			templateUrl: "/apps/SiteAssets/html/apps/equipmentrepairlog/views/view-create.html",
			controller: 'listController'
		})
		.state('filter', {
			url: '/filter',
			templateUrl: "/apps/SiteAssets/html/apps/equipmentrepairlog/views/view-filter.html",
			controller: 'listController'
		})
}]);

//run
app.run(function ($rootScope, $location) {	
  // register listener to watch route changes
	$rootScope.$on( "$locationChangeStart", function(event, next, current) {
        // not going to #login, we should redirect now
		if(getParameterByName("route", location.href) === "list" || getParameterByName("route", location.href) === "create" || getParameterByName("route", location.href) === "filter"){
        	$location.path( "/" + getParameterByName("route", location.href) );
		}
		else
			$location.path("/list");    
    });
});

//Services
app.service("userProfileService",["$http", function($http){
	var userProfileService = {
		getEmployeeInfo: function(userID) {
			var promise = $http(
			{
				method: 'POST',
				url: protocol + endpoint + 'GetUserProfile?username=' + sender +'&token=' + token,
				dataType: "json"
			})
			.then(function(json) {
				//get employee profile
				return json.data;
			});
			
			return promise;
		},
		getDownline: function(userID) {
			var promise = $http(
			{
				method: 'POST',
				url: protocol + endpoint + 'GetAllDownline?username=' + sender +'&token=' + token,
				dataType: "json"
			})
			.then(function(json) {
				//get employee profile
				return json.data;
			});
			
			return promise;
		},
		getIp: function () {
			var promise = $http(
			{
				method: 'POST',
				url: urlClydeWebService + '/GetIP',
				headers: {'Content-Type':undefined},
				dataType: "json"
			})
			//This is called a promise
			.then(function (json) {
				return json.data;
			})
			.catch(function (data) {
   			     // Handle error here
  			});
			
			return promise;
		},
		generateToken: function(code, salt, account, ip) {			
			// Set the key to a hash of the user's password + salt + username.
			var hashedPassword;

			var hashedPassword = CryptoJS.enc.Base64.stringify(CryptoJS.PBKDF2(code, salt,{hasher:CryptoJS.algo.SHA256, iterations: 1500, keySize: 8}));
			var key = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256([hashedPassword, salt, account].join(':'), salt));

			// Get the (C# compatible) ticks to use as a timestamp. http://stackoverflow.com/a/7968483/2596404
			var date = new Date();
			var ticks = ((date.getTime() * 10000) + 621355968000000000);
			// Construct the hash body by concatenating the username, ip, and userAgent.	
			var ua = navigator.userAgent.split(' ');
			var message = [account, ip, ua[2]+ua[1], ticks].join(':');

			// Hash the body, using the key.
			var hash = CryptoJS.HmacSHA256(message, key);
			// Base64-encode the hash to get the resulting token.
			var token = CryptoJS.enc.Base64.stringify(hash);
			// Include the username and timestamp on the end of the token, so the server can validate.
			var tokenId = [account, ticks].join(':');

			// Base64-encode the final resulting token.
			var tokenStr = CryptoJS.enc.Utf8.parse([token, tokenId].join(':'));
	
			return CryptoJS.enc.Base64.stringify(tokenStr);
		},
		getToken: function(userId, ip) {
			key = infoService.generateToken(_spPageContextInfo.userLoginName, _spPageContextInfo.systemUserKey,userId,ip);
			var jsonObject = JSON.stringify({Email: _spPageContextInfo.userLoginName, Key:key});
			var promise = $http(
			{
				method: 'POST',
				url: urlClydeWebService + '/GetToken',
				headers: {'Content-Type':undefined},
				data: jsonObject
			})
			//This is called a promise
			.then(function (json) {

				return json;
			})
			.catch(function (data) {
   			     // Handle error here
				console.log("Error:");
				console.log(data);
  			});
			
			return promise;
		},
		getUserProfileByName: function(name) {
			var promise = $http(
			{
				method: 'POST',
				url: protocol + endpoint + 'GetUserProfileByName?name=' + name +'&token=' + token,
				dataType: "json"
			})
			.then(function(json) {
				//get employee profile
				return json.data;
			});
			
			return promise;
		}
		
	};
	return userProfileService;
}]);

app.service("activeDirectoryService",["$http", function($http){
	var activeDirectoryService = {
		getCompanies: function() {
			var promise = $http(
			{
				method: 'POST',
				url: protocol + endpoint + 'GetAllCompanies?token=' + token,
				dataType: "json"
			})
			.then(function(json) {
				//get all companies data
				return json.data;
				
			});
			
			return promise;
		},
		getEquipments: function() {
			var jsonObject = JSON.stringify({Company: 2});
			var promise = $http(
			{
				method: 'POST',
				url: protocol + endpoint + 'GetEquipments',
				headers: {'Content-Type':undefined},
				data: jsonObject
			})
			.then(function(json) {
				//get all companies data
				return json.data;
				
			});
			
			return promise;
		},
		getFacilityLocations: function(company) {
			var promise = $http(
			{
				method: 'POST',
				url: protocol + endpoint + 'GetFacilityLocations?company=' + company + '&token=' +token,
				dataType: "json"
			})
			.then(function(json) {
				//get all companies data
				return json.data;
			});
			
			return promise;
		}
	};
	return activeDirectoryService;
}]);

app.directive('whenScrollEnds', function() {
	// console.log("in-here")
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			var visibleHeight = element.height();
			var threshold = 100;

			element.scroll(function() {
				var scrollableHeight = element.prop('scrollHeight');
				var hiddenContentHeight = scrollableHeight - visibleHeight;

				if (hiddenContentHeight - element.scrollTop() <= threshold) {
					// Scroll is almost at the bottom. Loading more rows
					scope.$apply(attrs.whenScrollEnds);
				}
			});
		}
	};
});

//controllers

// app.controller("menuController", ["$scope","$state","$uibModal", function($scope, $state, $uibModal){
		
// }]);

app.controller('listController', ["$scope", "$location", "$uibModal", "$state", "$http", "spBaseService", "activeDirectoryService", "userProfileService", function($scope, $location, $uibModal, $state, $http, spBaseService, activeDirectoryService,userProfileService) {	
	$scope.Account = sender;
	$scope.isUpdating = false;
	$scope.repairInfo = [];
	$scope.selected = {};
	$scope.isSelected = false;
	$scope.rows = [];
	$scope.noData = true;
	$scope.allDefects = [];
	$scope.status = [];
	$scope.statusNotes = [];
	$scope.jobNum = [];
	$scope.jobName = [];
	$scope.equipments = [];
	// $scope.equipmentName = [];
	// $scope.equipmentDescription = [];
	$scope.defectStatusNotesInfo = [];
	$(".spacious-container").floatingScroll("init");
	$scope.filterJobNumber = null;
	$scope.filterJobName = "CCI";
	$scope.filterStatus = "null";

	//Filter out company list (every company number that is less than 20)
	$scope.lessThan = function(company){
		return company.CompanyNumber < 20;
	}

	//clears the form for another entry
	$scope.clearForm = function(){
		$scope.form = {};
	}

	//empty replacement info on click.
	$scope.clearReplacement = function(){
		if($scope.form.replacement){
			$scope.form.replacement = "";
		}	
	}

	//add zero to minutes
	function addZero(i) {
    	if (i < 10) {
        	i = "0" + i;
    	}
    	return i;
	}

	//determine date time for now
	var date = new Date();
	var hours = date.getHours();
    var hours = (hours+24)%24; 
    var mid='AM';
    if(hours==0){ //At 00 hours we need to show 12 am
    	hours=12;
    }
    else if(hours>12)
    {
    	hours=hours%12;
    	mid='PM';
    }
	
	$scope.getData = function(){
		// var userId = _spPageContextInfo.userId;
		var getrepairInfoQuery = "/_api/web/lists/getbytitle('EquipmentRepairStatusLog')/items";
		spBaseService.getRequest(getrepairInfoQuery).then(function(data){
			if(data.d.results.length !== 0){
				$scope.repairInfo = [];
				for(var i = 0; i < data.d.results.length; i++){
					$scope.repairInfo[i] = data.d.results[i];
					if($scope.repairInfo[i].FirstReportedDate)
						$scope.repairInfo[i].FirstReportedDate = $scope.repairInfo[i].FirstReportedDate.split('T')[0];
					if($scope.repairInfo[i].RepairDate)
						$scope.repairInfo[i].RepairDate = $scope.repairInfo[i].RepairDate.split('T')[0];
				}
			}
			if($scope.defectStatusNotesInfo.length == 0){
				var getDefectStatusNotesInfoQuery = "/_api/web/lists/getbytitle('DefectsStatusNotes')/items";
				spBaseService.getRequest(getDefectStatusNotesInfoQuery).then(function(data){
					if(data.d.results.length !== 0){
						for(var i = 0; i < data.d.results.length; i++){
							$scope.defectStatusNotesInfo[i] = data.d.results[i];
							if($scope.defectStatusNotesInfo[i].Title === "Defects"){
								var temp = $scope.defectStatusNotesInfo[i].Description.split(',');
								for(var z =0; z < temp.length; z++){
									$scope.allDefects.push(temp[z]);
								}

							}
							if($scope.defectStatusNotesInfo[i].Title === "Status"){
								var temp = $scope.defectStatusNotesInfo[i].Description.split(',');
								for(var z =0; z < temp.length; z++){
									$scope.status.push(temp[z]);
								}

							}
							if($scope.defectStatusNotesInfo[i].Title === "StatusNotes"){
								var temp = $scope.defectStatusNotesInfo[i].Description.split(',');
								for(var z =0; z < temp.length; z++){
									$scope.statusNotes.push(temp[z]);
								}
							}
						}
					}
				});
			}
			//get equipment 
			activeDirectoryService.getEquipments().then(function(data){
				$scope.equipments = [];
				for(var i = 0; i < data.length; i++){
					var equipment = {equipmentNumber: data[i].EquipmentNumber, equipmentDescription: data[i].EquipmentDesc}
					$scope.equipments.push(equipment);
					// $scope.equipmentName.push(data[i].EquipmentNumber);
					// $scope.equipmentDescription.push(data[i].EquipmentDesc);
				}
				// console.log($scope.equipments)
				var getJobEndpoint = "https://clydelink.sharepoint.com/wwcprojects/_api/web/lists/getbytitle('Master Project List')/items"; 
				spBaseService.getRequest(null, getJobEndpoint).then(function(data){
				if(data.d.results.length !== 0){
					$scope.jobName = [];
					$scope.jobNum = [];
					for(var i = 0; i < data.d.results.length; i++){
						var jNum = data.d.results[i].Title.split('-')[0];
						jNum = String(jNum).trim();
						var jNam = data.d.results[i].Title;
						jNam = String(jNam).slice(String(jNum).length+1);
						if(jNum !== 'undefined')
							$scope.jobNum.push(jNum);
						if(jNam !== 'undefined')
							$scope.jobName.push(jNam);
					}
				}
				if($scope.filterJobNumber == null){
					//console.log("filter = null")
					$scope.filterModal();
				}

				});
			})
			// });			
		}).finally(function(){
			$(".spacious-container").floatingScroll("update");	
		});
	}

	$scope.loadScroll = function(){
		$(".spacious-container").floatingScroll("update");	
	}

	//this is to open the modal
	$scope.OpenModal = function(){
		//start loading
		$scope.isLoading = true;
		var modalInstance = $uibModal.open({
			templateUrl: '/apps/SiteAssets/html/apps/equipmentrepairlog/views/view-create.html',
			controller: 'RepairModalController',
			keyboard: false,
			backdrop: 'static',
			// scope: $scope,
			resolve: {
				// getSelectedEmployee: function () {
				// 	return $scope.form;
				// },
				getEquipments: function(){
					// $scope.equipments = [];
					return $scope.equipments;
				},
				defectsStatusNotes: function (){
					// console.log($scope.defectStatusNotesInfo)
					return $scope.defectStatusNotesInfo;
				}
			}
		});
		modalInstance.result.then(function () {
			$scope.getData();
			$scope.isLoading = false;
			
		}, function () {
			//modal dismissed
			$scope.isLoading = false;
		});
	}
	//this is to open the filter modal
	$scope.filterModal = function(){
		var modalInstance = $uibModal.open({
			templateUrl: '/apps/SiteAssets/html/apps/equipmentrepairlog/views/view-filter.html',
			controller: 'FilterModel',
			keyboard: false,
			backdrop: 'static',
			resolve: {
				jobNum: function () {
					return $scope.jobNum;
				},
				statusInfo: function () {
					return $scope.status;
				}
			}
		});
		modalInstance.result.then(function (form) {
			//console.log(form)
			$scope.filterJobNumber = form.filterJobNum;
			$scope.filterJobName = "CCI";
			$scope.filterStatus = form.filterStatus;				
		}, function () {
			//modal dismissed
		});
	}

	//Print CSS and Function
	$scope.print = function(){
		var printContents = document.getElementById("printable");
		 var htmlToPrint = '' +
        '<style type="text/css">' +
        'table th, table td {' +
        'border:1px solid #000;' +
        'font-size: 10px;' +
		'padding:0.5em;' +
        '}' +
        '</style>';
		htmlToPrint += printContents.outerHTML
   		newWin= window.open("");
   		newWin.document.write(htmlToPrint);
   		newWin.print();
		newWin.close();
	}

	//this is to Edit the modal
	$scope.EditModal = function(info, status){
		var modalInstance = $uibModal.open({
			templateUrl: '/apps/SiteAssets/html/apps/equipmentrepairlog/views/view-modify.html',
			controller: 'EditModalController',
			keyboard: false,
			backdrop: 'static',
			// scope: $scope,
			resolve: {
				editInfo: function () {
					return info;
				},
				statusInfo: function () {
					return $scope.status;
				}
			}
		});
		modalInstance.result.then(function (form) {
			$scope.getData();
				
		}, function () {
			//modal dismissed
		});
	}

	$scope.check = function(checkBoxName){
		$("#"+checkBoxName+"").not(this).prop('checked', false);
	}

	$scope.getSelectedState = function() {
		$scope.isSelected = false;
		angular.forEach($scope.selected, function(key, val) {
			if(key) {
				$scope.isSelected = true;
			}
		});
	}
}]);

app.controller('RepairModalController', ["$scope", "$http", "$uibModalInstance", "spBaseService", "activeDirectoryService", "getEquipments", "defectsStatusNotes", function ($scope, $http, $uibModalInstance, spBaseService, activeDirectoryService, getEquipments, defectsStatusNotes) {
	$scope.selectedEmployee = [];
	$scope.allDefects = [];
	$scope.status = [];
	$scope.statusNotes = [];
	$scope.jobNum = [];
	$scope.jobName = [];
	$scope.equipments = getEquipments;
	// $scope.defectStatusNotesInfo = defectsStatusNotes;
	$scope.form = {};
	$scope.defects = [];
	$scope.noDefects = false;

	$scope.totalDisplayed = 30;
	$scope.loadMore = function() {
      	$Scope.totalDisplayed += 20;
    };

	//validation function (check for null,empty and undefined)
	$scope.isValid = function(value) {
		return !value
	}

	$scope.loadMoreRecords = function() {
		//console.log("trying to load more")
		// Mocking stock values 
		// In an real application, data would be retrieved from an
		// external system
		$scope.totalDisplayed += 20;
		// var stock;
		// var i = 0;
		// while (i < chunkSize) {
		// 	currentIndex++;
		// 	var newDate = new Date();
		// 	newDate.setDate(todayDate.getDate() - currentIndex);
		// 	if (newDate.getDay() >= 1 && newDate.getDay() <= 5) {
		// 		stock = {
		// 			dateValue: newDate,
		// 			price: 20.0 + Math.random() * 10
		// 		};
		// 		$scope.stockList.push(stock);
		// 		i++;
		// 	}
		// }
	}

	// $scope.loadMoreRecords();

  	//close modal and redirect to main site
	$scope.ok = function () {
		var pushRepairInfoQuery = "/_api/web/lists/getbytitle('EquipmentRepairStatusLog')/items";
		var jobIndex = $scope.jobNum.indexOf($scope.form.jobNum);
		var equipIndex = $scope.equipmentName.indexOf($scope.form.equipmentNum);
		$scope.form.jobName = $scope.jobName[jobIndex];
		$scope.form.equipDesc = $scope.equipmentDescription[equipIndex];
		//push to sharepoint since we call getData during init
		var pushData = {
            	__metadata: { 'type': 'SP.Data.MasterEquipmentRepairStatusLogListItem' }, 
				Defect:$scope.form.defects, 
				DefectDescription:$scope.form.defectDesc, 
				EquipmentDescription:$scope.form.equipDesc, 
				EquipmentNumber:$scope.form.equipmentNum, 
				FirstReportJob:$scope.form.reportedJob,
				FirstReportedDate:$scope.form.reportedDate, 
				Title:$scope.form.jobNum, 
				JobName:$scope.form.jobName, 
				Priority:$scope.form.priority, 
				Status:$scope.form.status, 
				StatusNotes:$scope.form.statusNotes
		}
		spBaseService.postRequest(pushData, pushRepairInfoQuery).then(function(data){
			alert("You have successfully submitted a facilities access request.");
		});
		$uibModalInstance.close();
  	};
  
  	$scope.cancel = function () {
		$uibModalInstance.close();
  	};

	$scope.getData = function () {
		var getJobEndpoint = "https://clydelink.sharepoint.com/wwcprojects/_api/web/lists/getbytitle('Master Project List')/items"; 
		spBaseService.getRequest(null, getJobEndpoint).then(function(data){
			if(data.d.results.length !== 0){
				//console.log(data.d.results)
				$scope.jobName = [];
				$scope.jobNum = [];
				for(var i = 0; i < data.d.results.length; i++){
					var jNum = data.d.results[i].Title.split('-')[0];
					jNum = String(jNum).trim();
					var jNam = data.d.results[i].Title;
					jNam = String(jNam).slice(String(jNum).length+1);
					if(jNum !== 'undefined')
						$scope.jobNum.push(jNum);
					if(jNam !== 'undefined')
						$scope.jobName.push(jNam);
				}
			}
				//datepickers
				$('#starttimepicker').datetimepicker({
					ignoreReadonly: true
				});
				$("#starttimepicker").on("dp.change", function() {
					$scope.form.reportedDate = $("#datetimepicker").val();
				});

				for(var i = 0; i < defectsStatusNotes.length; i++){
					if(defectsStatusNotes[i].Title === "Defects"){
						var temp = defectsStatusNotes[i].Description.split(',');
						for(var z =0; z < temp.length; z++){
							$scope.allDefects.push(temp[z]);
						}

					}
					if(defectsStatusNotes[i].Title === "Status"){
						var temp = defectsStatusNotes[i].Description.split(',');
						for(var z =0; z < temp.length; z++){
							$scope.status.push(temp[z]);
						}

					}
					if(defectsStatusNotes[i].Title === "StatusNotes"){
						var temp = defectsStatusNotes[i].Description.split(',');
						for(var z =0; z < temp.length; z++){
							$scope.statusNotes.push(temp[z]);
						}

					}
				}
		});
	}
	$scope.checkDefects = function(){
			if(!$scope.isValid($scope.allDefects[0])){
				$("#defectsBtn").addClass("open");			
			}
			var i = 0;
			$scope.noDefects = true;
			$scope.form.defects = '';
			$("input[name=defect]").each( function () {
				//make sure at least one item is selected
				var checked = $(this)[0].checked;
				if(checked){
					$scope.noDefects = !checked;
					if($scope.form.defects.length === 0){
						$scope.form.defects += ($scope.allDefects[i]);
					}
					else{
						$scope.form.defects += (", " + $scope.allDefects[i]);
					}
					
				}
				$scope.allDefects[i].checked = checked;
				i++;
			});
		}
}]);

app.controller('EditModalController', ["$scope", "$http", "$uibModalInstance", "spBaseService", "editInfo", "statusInfo", function ($scope, $http, $uibModalInstance, spBaseService, editInfo, statusInfo) {
	$scope.form = {};
	$scope.editInfo = editInfo;
	$scope.form.repairedDate = $scope.editInfo.RepairDate;
	$scope.form.repairedBy = $scope.editInfo.RepairedBy;
	$scope.form.meterReading = $scope.editInfo.MeterReading;
	$scope.form.smrRepa = $scope.editInfo.SMRRepair;
	$scope.form.notes = $scope.editInfo.Notes;
	$scope.form.status = $scope.editInfo.Status;
	$scope.status = statusInfo;
	// console.log(statusInfo)

	
	//datepickers
	$scope.getData = function(){
		$('#repairedtimepicker').datetimepicker({
			ignoreReadonly: true
		});
		$("#repairedtimepicker").on("dp.change", function() {
			$scope.form.repairedDate = $("#datetimepicker1").val();
		});
	}

	$scope.ok = function() {
		var updateAccessInfoQuery = "/_api/web/lists/getbytitle('EquipmentRepairStatusLog')/items(" + $scope.editInfo.Id + ")"
		
		var updateItem = {
			__metadata: {
				type: "SP.Data.MasterEquipmentRepairStatusLogListItem"
			},
			Status: $scope.form.status,
			RepairDate: $scope.form.repairedDate,
			RepairedBy: $scope.form.repairedBy,
			MeterReading: $scope.form.meterReading,
			SMRRepair: $scope.form.smrRepa,
			Notes: $scope.form.notes

		}
		spBaseService.updateRequest(updateItem, updateAccessInfoQuery).then(function(data){
			alert("Your changes have been submitted");
		});
		// console.log($scope.editInfo)
		$uibModalInstance.close();
	}

	$scope.cancel = function () {
		// console.log($scope.editInfo)
		$uibModalInstance.close();
	};
}]);

app.controller('FilterModel', ["$scope", "$uibModalInstance", "jobNum", "statusInfo", function ($scope, $uibModalInstance, jobNum, statusInfo) {
	$scope.form = {};
	$scope.jobNum = jobNum;
	$scope.status = statusInfo;

	$scope.ok = function() {
		//console.log($scope.form.filterJobNum +" "+ $scope.form.filterStatus)
		if($scope.form.filterStatus == null){
			$scope.form.filterStatus = "all";
		}
		$uibModalInstance.close($scope.form);
		//return $scope.form;
	}
}]);

window.addEventListener("load",function() {
    // Set a timeout...
    setTimeout(function(){
        // Hide the address bar!
        window.scrollTo(0, 1);
    }, 1000);
});