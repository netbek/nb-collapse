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
			'nb.gsap'
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
				config = extend(true, {}, config, values);
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

	/**
	 * Checks if value is an object created by the Object constructor.
	 *
	 * @param {mixed} value
	 * @returns {Boolean}
	 */
	function isPlainObject (value) {
		return (!!value && typeof value === 'object' && value.constructor === Object
			// Not DOM node
			&& !value.nodeType
			// Not window
			&& value !== value.window);
	}

	/**
	 * Merge the contents of two or more objects together into the first object.
	 *
	 * Shallow copy: extend({}, old)
	 * Deep copy: extend(true, {}, old)
	 *
	 * Based on jQuery (MIT License, (c) 2014 jQuery Foundation, Inc. and other contributors)
	 */
	function extend () {
		var options, key, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if (typeof target === 'boolean') {
			deep = target;

			// Skip the boolean and the target
			target = arguments[i] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if (!isPlainObject(target) && !angular.isFunction(target)) {
			target = {};
		}

		// If only one argument is passed
		if (i === length) {
			i--;
		}

		for (; i < length; i++) {
			// Only deal with non-null/undefined values
			if ((options = arguments[i]) != null) {
				// Extend the base object
				for (key in options) {
					src = target[key];
					copy = options[key];

					// Prevent never-ending loop
					if (target === copy) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = angular.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && angular.isArray(src) ? src : [];
						}
						else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[key] = extend(deep, clone, copy);
					}
					// Don't bring in undefined values
					else if (copy !== undefined) {
						target[key] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	}
})(window, window.angular);
