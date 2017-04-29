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

        let isFiltersInitialCb = true;

        // Callback for filters updated event.
        // Need to debounce it to prevent calls for intermediate results
        const filtersUpdatedCb = utils.debounce(
          (reply) => {

            // Ignore first initial call
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
              // Need to replace spaces in properties names
              filters[f.qField.replace(/ /g, '__')] = f.qSelected.split(', ');
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

            const newItemEvent = utils.buildNewItemEvent({
              properties: filterSet
            });
            const viewItemEvent = utils.buildViewEvent({
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
              .then(event => {
                logEvent(
                  'Send new item event:\n' + 
                  JSON.stringify(event)
                )
              })
              .then(() => utils.sendEvent(viewItemEvent))
              .then(event => {
                logEvent(
                  'Send usage event:\n' + 
                  JSON.stringify(event)
                )
              })
              .then(() => utils.queryRecommendations())
              .then((recommendationList) => {
                logEvent(
                  'Retrieve recommendations:\n' + 
                  JSON.stringify(recommendationList)
                );
                recommendedFilterSetList = recommendationList.itemScores.map(
                  r => {
                    const f = utils.withoutKeys(
                      r.source,
                      ['id', 'view']
                    );
                    return JSON.stringify(f);
                  }
                );
              })
              .then(() => {
                $scope.$apply(() => {
                  // Display recommendations
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
        $scope.recommendedFilterSetList = [];
      }]
    };

  }
);
