(function(module) {
	mifosX.controllers = _.extend(module, {
		ClientToAccountingHeaderTransfer: function($q, scope, resourceFactory, location, routeParams, dateFilter) {
			scope.restrictDate = new Date();
			/* Needed to fetch the account types dropdown */
			var params = { fromAccountType: 0 };

			scope.offices = [];
			scope.toAccountTypes = [];
			scope.toAccounts = [];
			scope.formData = {};
			scope.formData.dbAccounts = [{}];
			scope.restrictDate = new Date();
			scope.showPaymentDetails = false;
			scope.toClientData = "";
			scope.formData.mobilization = 0;
			scope.formData.servicing = 0;
			scope.formData.overheads = 0;
			scope.formData.investment = 0;

			scope.back = function() {
				window.history.back();
			};
			resourceFactory.accountCoaResource.getAllAccountCoas({ manualEntriesAllowed: true, usage: 1, disabled: false }, function(data) {
				scope.glAccounts = data;
			});

			resourceFactory.paymentTypeResource.getAll(function(data) {
				scope.paymentTypes = data;
			});

			resourceFactory.currencyConfigResource.get({ fields: 'selectedCurrencyOptions' }, function(data) {
				scope.currencyOptions = data.selectedCurrencyOptions;
				scope.formData.currencyCode = scope.currencyOptions[0].code;
			});

			resourceFactory.officeResource.getAllOffices(function(data) {
				scope.offices = data;
				scope.formData.officeId = scope.offices[0].id;
			});

			resourceFactory.accountTransfersTemplateResource.get(params, function(data) {
				scope.toAccountTypes = data.toAccountTypeOptions;
				// Below line does not work as the data.transferDate is an array
				//this.formData.transferDate = dateFilter(data.transferDate, scope.df);
			});

			//events for debits
			scope.addDebitAccount = function() {
				scope.formData.dbAccounts.push({});
			}

			scope.removeDebitAccount = function(index) {
				scope.formData.dbAccounts.splice(index, 1);
			}

			scope.clientOptions = function(value) {
				let deferred = $q.defer();
				resourceFactory.clientResource.getAllClientsWithoutLimit({
					displayName: value, orderBy: 'displayName', officeId: scope.formData.officeId,
					sortOrder: 'ASC', orphansOnly: false
				}, function(data) {
					let resultArray = data.pageItems;
					let arrLength = resultArray.length;
					if (arrLength > 7) {
						arrLength = arrLength - 7;
						resultArray.splice(7, arrLength);
					}
					deferred.resolve(resultArray);
				});
				return deferred.promise;
			};

			scope.changeClient = function(client) {
				scope.formData.toClientId = client.id;
				scope.changeEvent();
			};

			scope.changeEvent = function() {
				let localParams = scope.formData;
				delete params.transferDescription;

				resourceFactory.accountTransfersTemplateResource.get(localParams, function(data) {
					scope.toAccountTypes = data.toAccountTypeOptions;
					scope.toAccounts = data.toAccountOptions;
				});
			};

			scope.clientTypeAheadDisplay = function(client) {
				if (client == null || client == undefined)
					return;
				if (client.id == '' || client.id == undefined) {
					return '';
				}
				var label = client.accountNo + "-" + client.displayName;
				return label;
			};

			var validateAmount = function(amount, accountingHeaders) {
				let totalAmount = 0;
				if (!Array.isArray(accountingHeaders)) {
					// If accountingHeaders is not an array cannot compute further
					return false;
				}
				for (let i = 0; i < accountingHeaders.length; i++) {
					let value = (accountingHeaders.amount !== null && typeof (accountingHeaders.amount) !== "undefined") ? accountingHeaders.amount : 0;
					switch (accountingHeaders.type) {
						case "credit": totalAmount += value;
							break;
						case "debit": totalAmount -= value;
					}
				}
				if (amount !== totalAmount) return false;
				return true;
			}

			scope.submit = function() {
				console.log("ClientToAccountingHeaderTransfer.Submit has been called:" + scope.formData.toClientId);
				if (this.formData.transferDate) this.formData.transferDate = dateFilter(this.formData.transferDate, scope.df);

				let transferTransaction = new Object();
				transferTransaction.locale = scope.optlang.code;
				transferTransaction.dateFormat = scope.df;
				transferTransaction.officeId = this.formData.officeId;
				transferTransaction.currencyCode = this.formData.currencyCode;

				transferTransaction.toWhomToTransfer = this.formData.toWhomToTransfer;
				transferTransaction.transactionDate = this.formData.transferDate;
				transferTransaction.toClientId = this.formData.toClientData.id;
				transferTransaction.toAccountType = this.formData.toAccountType;
				transferTransaction.toAccountId = this.formData.toAccountId;

				transferTransaction.amount = this.formData.amount;
				transferTransaction.paymentTypeId = this.formData.paymentTypeId;
				transferTransaction.accountNumber = this.formData.accountNumber;
				transferTransaction.checkNumber = this.formData.checkNumber;
				transferTransaction.routingCode = this.formData.routingCode;
				transferTransaction.receiptNumber = this.formData.receiptNumber;
				transferTransaction.bankNumber = this.formData.bankNumber;
				transferTransaction.transferDescription = this.formData.transferDescription;

				transferTransaction.mobilization = this.formData.mobilization;
				transferTransaction.servicing = this.formData.servicing;
				transferTransaction.overheads = this.formData.overheads;
				transferTransaction.investment = this.formData.investment;

				//construct account-headers array
				transferTransaction.accountingHeaders = [];
				for (var i = 0; i < this.formData.dbAccounts.length; i++) {
					var temp = new Object();
					if (this.formData.dbAccounts[i].select) {
						temp.glAccountId = this.formData.dbAccounts[i].select.id;
					}
					temp.amount = this.formData.dbAccounts[i].amount;
					temp.type = this.formData.dbAccounts[i].crDrOptSelected;
					transferTransaction.accountingHeaders.push(temp);
				}

				resourceFactory.clientToAccountingHeaderTransferResource.save(transferTransaction, function(data) {
					location.path('/viewtransactions/' + data.transactionId);
				});
			};
		}
	});
	mifosX.ng.application.controller('ClientToAccountingHeaderTransfer', ['$q', '$scope', 'ResourceFactory', '$location', '$routeParams', 'dateFilter', mifosX.controllers.ClientToAccountingHeaderTransfer]).run(function($log) {
		$log.info("ClientToAccountingHeaderTransfer initialized");
	});
}(mifosX.controllers || {}));
