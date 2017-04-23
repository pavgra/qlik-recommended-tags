define(
	[
		'qlik',
    'text!./template.ng.html',
		'./utils',
	],
	function ( qlik, template, utils ) {
		const CURRENT_VIEW_ID = 'rs-view';

		return {
			template: template,
			support: { snapshot: true, },
			controller: ['$scope', function ( $scope ) {
				const eventList = [];

				function logEvent(event) {
					$scope.$apply(() => eventList.push(event));
				}

				const userId = 1;
				const filterParams = {
					properties: {
						view: CURRENT_VIEW_ID,
						filters: {
							category1: ['a', 'b'],
							category2: ['c'],
						}
					}
				};
				const newItemEvent = utils.buildNewItemEvent({ properties: filterParams });
				const viewEvent = utils.buildViewEvent({
					userId: userId,
					properties: filterParams,
				});

				utils
					.sendEvent(newItemEvent)
					.then(event => logEvent('Send new item event:\n' + JSON.stringify(event)))
					.then(() => utils.sendEvent(viewEvent))
					.then(event => logEvent('Send usage event:\n' + JSON.stringify(event)))
					.then(() => utils.queryRecommendations())
					.then((recommendationList) => {
						logEvent('Retrieve recommendations:\n' + JSON.stringify(recommendationList));
					});

				$scope.eventList = eventList;
			}]
		};

	}
);
