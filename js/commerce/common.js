angular.module('commerce.common', [])
	.factory('commerceImagePreloader', function ($q) {
		var load = function (images) {
			var mainDfd = $q.defer(), imagePromises = [];
			images = angular.isArray(images) ? images : [images];
			angular.forEach(images, function (src) {
				var image = new Image(),
					imageDfd = $q.defer();
				imagePromises.push(imageDfd.promise);
				image.onload = function () {
					imageDfd.resolve('image: ' + src + ' was to cache loaded');
				};
				image.src = src;
			});
			$q.all(imagePromises).then(function () {
				mainDfd.resolve('All images were loaded to cache');
			});
			return mainDfd.promise;
		};
		return {
			load: load
		};
	})
	.factory('commerceMouse', function () {
		var getOffset = function (event) {
			var out = {}, eventSource;
			if (event.offsetX == null) { // Firefox
				eventSource = event.originalEvent ? event.originalEvent : event;
				out.mouseX = eventSource.layerX;
				out.mouseY = eventSource.layerY;
			} else {                       // Other browsers
				out.mouseX = event.offsetX;
				out.mouseY = event.offsetY;
			}
			return out;
		};
		return {
			getOffset: getOffset
		};
	})
	.factory('commerceUtils', function ($http, $q) {
		return {
			getCurrentLanguage: function () {
				var lang = 'ru', match;
				angular.forEach(location.search.replace(/\?/, '').split(/$/), function (queryPart) {
					match = queryPart.split(/=/);
					if (match[0] == 'lang') lang = match[1];
				});
				match = location.pathname.match(/^\/(\w{2})/);
				if (match && match.length > 1) lang = match[1];
				return lang;
			},
			createUrl: function (url) {
				return '/' + this.getCurrentLanguage() + '/' + url
			},
			query: function(url, data){
				data = data || {};
				var dfd = $q.defer();
				$http.get(this.createUrl(url), data).then(function(response){
					dfd.resolve(response.data);
				});
				return dfd.promise;
			}
		}
	})
	.directive('commerceLoader', function () {
		return {
			restrict: 'E',
			replace: true,
			template: '<div class="loader" ng-class="{loading: loading}"><div class="outer-circle"></div><div class="inner-circle"></div></div>',
			scope: {
				loading: '='
			}
		}
	})
	.directive('commerceOverlay', function(){
		return {
			restrict: 'E',
			replace: true,
			template: '<div class="overlay" ng-class="{loading: loading}"></div>',
			scope: {
				loading: '='
			}
		}
	})
	.directive('commerceError', function(){
		return {
			restrict: 'E',
			replace: true,
			template: '<div class="label label-danger" ng-show="value">{{error}}</div>',
			scope:{
				value: '='
			},
			link:function(scope){
				scope.$watch('value', function(){
					scope.error = angular.isArray(scope.value) ? scope.value.join(',') : scope.value;
				})

			}
		}
	})
	.directive('commerceDropdown', function ($document) {
		return {
			restrict: 'A',
			scope: {},
			link: function (scope, element) {
				scope.open = false;
				element.on('click', function (event) {
					event.preventDefault();
					event.stopPropagation();
					if (scope.open) {
						scope.open = false;
						element.parent().removeClass('open');
					} else {
						scope.open = true;
						element.parent().addClass('open');
						$document.on('click.commerce.dropdown', function (event) {
							scope.open = false;
							element.parent().removeClass('open');
							$document.off('click.commerce.dropdown');
						});
					}
				});
			}
		}
	}).directive('commerceTooltip', function ($timeout) {
		return {
			restrict: 'A',
			link: function (scope, element, attributes) {
				var tooltip;
				element.on('mouseenter', function () {
					if (!tooltip) {
						var bodyRect = document.body.getBoundingClientRect(),
							offset = element[0].getBoundingClientRect();
						tooltip = angular.element('<div class="commerce-tooltip">' + attributes.commerceTooltip + '</div>');
						angular.element('body').append(tooltip);
						tooltip.css({
							left: (offset.left - bodyRect.left + (element[0].offsetWidth - tooltip[0].offsetWidth) / 2  ) + 'px',
							top: (offset.top - bodyRect.top - element[0].offsetHeight - 8 ) + 'px'
						});
					}
					tooltip.addClass('in');

				});
				element.on('mouseleave', function () {
					tooltip.removeClass('in');
				});

			}
		}
	}).directive('commerceSpinner', function () {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function (scope, inputElement, attributes, modelCtrl) {
				var spinnerWrap = angular.element('<div />').addClass('cmr-spinner-wrap');
				var spinUp = angular.element('<div />').addClass('cmr-spinner-up').appendTo(spinnerWrap);
				var spinDown = angular.element('<div />').addClass('cmr-spinner-down').appendTo(spinnerWrap);
				spinnerWrap.insertBefore(inputElement);
				inputElement.appendTo(spinnerWrap);

				spinUp.on('click', function () {
					updateInput((parseInt(inputElement.val()) + 1));
				});
				spinDown.on('click', function () {
					if (parseInt(inputElement.val()) > 0) {
						updateInput((parseInt(inputElement.val()) - 1));
					}
				});
				var updateInput = function(value){
					modelCtrl.$setViewValue( value);
					modelCtrl.$render();
					scope.$apply();
				}
			}
		}
	}).directive('cmrThumb', function(){
		return {
			restrict: 'E',
			replace: true,
			scope: {
				width: '=',
				height: '=',
				source: '='
			},
			template: '<img ng-src="{{thumbSource}}">',
			link: function(scope){
				scope.$watch('source', function(source){
					if(source){
						var matches = source.match(/([\w\d.\/]*\/)([\w\d]+)(.+)/);
						scope.thumbSource = matches[1]+'.tmb/'+matches[2]+'_'+scope.width+'x'+scope.height + matches[3];
					}
				})
			}

		}
	}).directive('commerceSearch', function($location, $rootScope){
		return {
			restrict: 'A',
			link: function(scope, element){
				element.on('keydown',function(event){
					if(event.which === 13) {
						$rootScope.$apply(function() {
							$location.path('/search/'+ element.val());
						});
						event.preventDefault();
					}

				});
			}
		}
	}).animation('.view-scroll-animation', function() {
		return {
			enter : function(element, done) {
				var scrollAnimation = function(){
					if(element.hasClass('ng-enter')){
						setTimeout(scrollAnimation, 50)
					} else {
						$('html, body').animate({scrollTop: $(".view-scroll-animation").offset().top - 147}, 300);
					}
				};
				scrollAnimation();
			}
		};
	});
