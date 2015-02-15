/**
 * AngularJS directive for a collapsible element
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.collapse', [
			'ngAnimate',
			'nb.gsap',
			'nb.lodash'
		])
		.provider('nbCollapseConfig', nbCollapseConfig)
		.directive('nbCollapse', nbCollapseDirective)
		.animation('.in', inAnimation);

	function nbCollapseConfig () {
		var config = {
			transitionDuration: 1,
			transitionEase: 'easeNoneLinear'
		};
		return {
			set: function (values) {
				_.merge(config, values);
			},
			$get: function () {
				return config;
			}
		};
	}

	nbCollapseDirective.$inject = ['$animate', '$timeout', 'GSAP'];
	function nbCollapseDirective ($animate, $timeout, GSAP) {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				element.addClass('collapse');

				var deregister = [];
				var timeouts = [];
				var initialAnimSkip = true;
				var transition; // function

				function doTransition (callback) {
					transition = callback;

					return function () {
						transition.call();
					};
				}

				function open () {
					if (initialAnimSkip) {
						initialAnimSkip = false;
						openDone();
					}
					else {
						timeouts.push($timeout(function () {
							$animate.addClass(element, 'in', doTransition(openDone));
						}));
					}
				}

				function openDone () {
					element.removeClass('transitioning');
					element.addClass('in');
					element.css({height: 'auto'});
				}

				function close () {
					element.addClass('transitioning');

					if (initialAnimSkip) {
						initialAnimSkip = false;
						element.css({height: 0});
						closeDone();
					}
					else {
						timeouts.push($timeout(function () {
							$animate.removeClass(element, 'in', doTransition(closeDone));
						}));
					}
				}

				function closeDone () {
					element.removeClass('transitioning');
					element.removeClass('in');
				}

				deregister.push(scope.$watch(attrs.nbCollapse, function (newVal) {
					if (newVal) {
						close();
					}
					else {
						open();
					}
				}));

				scope.$on('$destroy', function () {
					angular.forEach(deregister, function (fn) {
						fn();
					});

					angular.forEach(timeouts, function (timeout) {
						$timeout.cancel(timeout);
					});

					GSAP.TweenMax.killTweensOf(element);
				});
			}
		};
	}

	inAnimation.$inject = ['GSAP', 'nbCollapseConfig'];
	function inAnimation (GSAP, nbCollapseConfig) {
		return {
			addClass: function (element, className, done) {
				if (className == 'in') {
					var duration = Number(element.attr('transition-duration')) || nbCollapseConfig.transitionDuration;
					var ease = element.attr('transition-ease') || nbCollapseConfig.transitionEase;

					GSAP.TweenMax.to(element, duration, {
						ease: ease,
						height: element[0].scrollHeight,
						onComplete: done,
						overwrite: 'all'
					});
				}
			},
			removeClass: function (element, className, done) {
				if (className == 'in') {
					var duration = Number(element.attr('transition-duration')) || nbCollapseConfig.transitionDuration;
					var ease = element.attr('transition-ease') || nbCollapseConfig.transitionEase;

					GSAP.TweenMax.to(element, duration, {
						ease: ease,
						height: 0,
						onComplete: done,
						overwrite: 'all'
					});
				}
			}
		};
	}
})(window, window.angular);
