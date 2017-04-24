define(
  [
    'qlik',
    'text!./template.ng.html',
    './utils',
  ],
  function ( qlik, template, utils ) {
    const CURRENT_VIEW_ID = 'rs-view';
    const userId = 1;

    const app = qlik.currApp(this);

    return {
      template: template,
      support: { snapshot: true, },
      controller: ['$scope', function ( $scope ) {
        const eventList = [];

        const logEvent = function(event) {
          console.log('>> ' + event);
          $scope.$apply(() => eventList.push(event));
        }

        // Ignore first initial call
        let isFiltersInitialCb = true;

        const filtersUpdatedCb = utils.debounce(
          (reply) => {
            if (isFiltersInitialCb) {
              console.log('>> Ignoring initial CurrentSelections event');
              isFiltersInitialCb = false;
              return;
            }

            /*
            * Parse filters from Qlik format
            */

            const rawSelectedFilters = reply.qSelectionObject.qSelections;
            let filters = {};

            rawSelectedFilters.forEach(f => {

              // TODO: Replace spaces in key name!

              filters[f.qField] = f.qSelected.split(', ');
            });

            /*
            * Build events
            */
           
            const filterSet = Object.assign(
              {},
              filters,
              {
                view: CURRENT_VIEW_ID,
              }
            );

            const newItemEvent = utils.buildNewItemEvent({ properties: filterSet });
            const viewEvent = utils.buildViewEvent({
              userId: userId,
              itemId: newItemEvent.entityId,
            });

            /*
            * Send events to server and query recommendations
            */
           
           const currentFilterSet = filters;
           let recommendedFilterSetList = [];

            utils
              .sendEvent(newItemEvent)
              .then(event => logEvent('Send new item event:\n' + JSON.stringify(event)))
              .then(() => utils.sendEvent(viewEvent))
              .then(event => logEvent('Send usage event:\n' + JSON.stringify(event)))
              .then(() => utils.queryRecommendations())
              .then((recommendationList) => {
                logEvent('Retrieve recommendations:\n' + JSON.stringify(recommendationList));
                recommendedFilterSetList = recommendationList.itemScores.map(r => JSON.stringify(r.source))
              })
              .then(() => {
                $scope.$apply(() => {
                  $scope.currentFilterSet = currentFilterSet;
                  $scope.recommendedFilterSetList = recommendedFilterSetList;
                });
              });
          },
          3000
        );

        // Listen to change of selected filters
        app.getList('CurrentSelections', filtersUpdatedCb);

        $scope.eventList = eventList;
        $scope.currentFilterSet = null;
        // $scope.recommendedFilterSetList = ['a', 'b'];
      }]
    };

  }
);
