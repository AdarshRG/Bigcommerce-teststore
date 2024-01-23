import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';

export const CartPreviewEvents = {
    close: 'closed.fndtn.dropdown',
    open: 'opened.fndtn.dropdown',
};

export default function (secureBaseUrl, cartId) {
    const loadingClass = 'is-loading';
    const $cart = $('[data-cart-preview]');
    const $cartDropdown = $('#cart-preview-dropdown');
    const $cartLoading = $('<div class="loadingOverlay"></div>');

    const $body = $('body');

    if (window.ApplePaySession) {
        $cartDropdown.addClass('apple-pay-supported');
    }
    

    $body.on('cart-quantity-update', (event, quantity) => {
        $cart.attr('aria-label', (_, prevValue) => prevValue.replace(/\d+/, quantity));

        if (!quantity) {
            $cart.addClass('navUser-item--cart__hidden-s');
        } else {
            $cart.removeClass('navUser-item--cart__hidden-s');
        }

        $('.cart-quantity')
            .text(quantity)
            .toggleClass('countPill--positive', quantity > 0);
        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
        }
    });

    $cart.on('click', event => {
        const options = {
            template: 'common/cart-preview',
        };

        // Redirect to full cart page
        //
        // https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
        // In summary, we recommend looking for the string 'Mobi' anywhere in the User Agent to detect a mobile device.
        if (/Mobi/i.test(navigator.userAgent)) {
            return event.stopPropagation();
        }

        event.preventDefault();

        $cartDropdown
            .addClass(loadingClass)
            .html($cartLoading);
        $cartLoading
            .show();

        utils.api.cart.getContent(options, (err, response) => {
            $cartDropdown
                .removeClass(loadingClass)
                .html(response);
            $cartLoading
                .hide();
        });
    });

    let quantity = 0;

    if (cartId) {
        // Get existing quantity from localStorage if found
        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem('cart-quantity')) {
                quantity = Number(localStorage.getItem('cart-quantity'));
                $body.trigger('cart-quantity-update', quantity);
            }
        }

        // Get updated cart quantity from the Cart API
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: secureBaseUrl, cartId }, (err, qty) => {
                if (err) {
                    // If this appears to be a 404 for the cart ID, set cart quantity to 0
                    if (err === 'Not Found') {
                        resolve(0);
                    } else {
                        reject(err);
                    }
                }
                resolve(qty);
            });
        });

        // If the Cart API gives us a different quantity number, update it
        cartQtyPromise.then(qty => {
            quantity = qty;
            $body.trigger('cart-quantity-update', quantity);
        });
    } else {
        $body.trigger('cart-quantity-update', quantity);
    }

    // $cartDropdown.on('click', event => {
    //     event.stopPropagation();
    // });

   //cart increment and decrement.................................................................
   $(document).on('click', '.cart-increment,.cart-decrement', function (event) {
        let container = $(this).closest('.qty-container');
        let itemId = container.data('cart-itemid');
        let cartQtyElement = container.find('.cart-qty');
        let cartQty = parseInt(cartQtyElement.text(), 10);
        const maxQty = parseInt(cartQtyElement.attr('data-quantity-max'), 10);
        const minQty = parseInt(cartQtyElement.attr('data-quantity-min'), 10);
        const minError = cartQtyElement.attr('data-quantity-min-error');
        const maxError = cartQtyElement.attr('data-quantity-max-error');
        const newQty = $(this).data('action') === 'inc' ? cartQty + 1 : cartQty - 1;
        if (newQty < minQty) {
            return showAlertModal(minError);
        } else if (maxQty > 0 && newQty > maxQty) {
            return showAlertModal(maxError);
        }

        $cartDropdown
            .addClass(loadingClass)
            .html($cartLoading);
        $cartLoading
            .show();
        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            if (response.data.status === 'succeed') {
                const optionss = {
                    template: 'common/cart-preview'
                };
                
                getCartItems(optionss);
            } 
            else {
                cartQuantity();
                showAlertModal(response.data.errors.join('\n'));
            }
            $(document).on('click', '.delete-mini-cart-item', function (event) {
                const itemId = $(event.currentTarget).data('cartItemid');
                $cartDropdown
                    .addClass(loadingClass)
                    .html($cartLoading);
                    $cartLoading
                        .show();
                cartRemoveItem(itemId);
            });  
           
            function cartRemoveItem(itemId){
                utils.api.cart.itemRemove(itemId, (err, response) => {
                   
                    if (response.data.status === 'succeed') {
                        const optionss = {
                            template: 'common/cart-preview'
                        };
                        getCartItems(optionss);
        
                    } else {
                        cartQuantity();
                        showAlertModal(response.data.errors.join('\n'));
                    }
                });
            }
           
        });
    })

    function getCartItems(options) {
        utils.api.cart.getContent(options, (err, response) => { //get html content form cart-preview.html
            $cartDropdown
                .html(response);
        })
       
    }




function getCartDetails() {
  const requestOptions = {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  api.get('/api/storefront/carts?include=lineItems.physicalItems', requestOptions, (error, response) => {
    if (error) {
      console.error('Error fetching cart details:', error);
      return;
    }

    const cart = response.data;
    console.log('Cart Details:', cart);

  });
}
getCartDetails();


}
