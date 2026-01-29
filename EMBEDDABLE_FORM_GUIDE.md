# Embeddable Order Form - User Guide

## Overview

The embeddable order form allows you to integrate Ordo's order collection system directly into your website, WordPress site, or Elementor pages. Customers can place orders without leaving your website, and orders are automatically routed to your sales reps via the round-robin system.

## Features

✅ **Fully Responsive** - Works on desktop, tablet, and mobile devices
✅ **Easy Integration** - Simple copy-paste embed code
✅ **Real-time Validation** - Ensures all required fields are completed
✅ **Automatic Order Routing** - Orders automatically assigned to sales reps
✅ **Multiple Integration Methods** - HTML iframe, Elementor, and JavaScript
✅ **Customizable Dimensions** - Adjust width and height to fit your design
✅ **Success Notifications** - Customers see confirmation after submission
✅ **Secure** - Configured with proper CORS and security headers

## How to Access

1. Log in to the admin dashboard
2. Navigate to **"Embed Form"** in the sidebar (icon: `</>`)
3. The embed form management page will open

## Integration Methods

### 1. HTML/iframe Embed (Recommended)

**Best for**: Static websites, HTML pages, most CMS platforms

**Steps**:
1. Go to the Embed Form page
2. Adjust width and height as needed
3. Click the "HTML/iframe" tab
4. Click "Copy" button
5. Paste the code into your HTML page where you want the form

**Example Code**:
```html
<iframe
  src="https://yourdomain.com/order-form/embed"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
  title="Order Form"
></iframe>
```

### 2. Elementor Integration (WordPress)

**Best for**: WordPress sites using Elementor page builder

**Steps**:
1. Go to the Embed Form page
2. Click the "Elementor" tab
3. Copy the code
4. In Elementor editor, drag an "HTML" widget to your page
5. Paste the iframe code
6. Set widget width to "Full Width" for best results
7. Save and preview

**Alternative - Shortcode Method**:
You can also create a WordPress shortcode for easier reuse:

1. Add the PHP code from the Elementor tab to your theme's `functions.php`
2. Use the shortcode `[ordo_order_form]` anywhere on your site

### 3. JavaScript Embed

**Best for**: Dynamic websites, SPAs, or when you need programmatic control

**Steps**:
1. Go to the Embed Form page
2. Click the "JavaScript" tab
3. Copy the code
4. Paste it where you want the form to appear
5. The form will load dynamically

**Example Code**:
```html
<div id="ordo-order-form"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://yourdomain.com/order-form/embed';
    iframe.width = '100%';
    iframe.height = '800';
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    iframe.title = 'Order Form';
    document.getElementById('ordo-order-form').appendChild(iframe);
  })();
</script>
```

## Customization Options

### Width
- **Percentage** (recommended): `100%` - Responsive, fills container
- **Fixed pixels**: `600px` - Fixed width, good for sidebars
- **Viewport units**: `80vw` - Relative to screen size

### Height
- **Recommended**: `800px` - Standard height that fits most forms
- **Compact**: `600px` - For shorter layouts (may require scrolling)
- **Expanded**: `1000px` - For users who prefer no scrolling

### Styling Tips
The embed code includes default styling for professional appearance:
- Border radius: 8px (rounded corners)
- Box shadow: Subtle drop shadow for depth
- No border: Clean, modern look

You can customize these in the code after copying.

## Live Preview

The Embed Form page includes a live preview that updates as you adjust dimensions. Use this to test how the form will look on your site before copying the code.

## What Happens After Submission

1. **Customer submits order** via embedded form
2. **Form validates** all required fields
3. **Success message** displayed to customer
4. **Order created** in Ordo system
5. **Sales rep assigned** via round-robin
6. **Notification sent** to assigned sales rep (if enabled)
7. **Order appears** in sales rep's dashboard

## Security & Privacy

### Security Features
- **CORS configured** - Only embed URL allows iframe embedding
- **HTTPS required** - Secure data transmission
- **Input validation** - Server-side validation of all fields
- **XSS protection** - Input sanitization
- **CSRF protection** - Form submission security

### Data Privacy
- Customer data is only accessible to authorized users
- No third-party tracking in the embed form
- Complies with data protection requirements

## Troubleshooting

### Form Not Displaying

**Issue**: Iframe appears blank or shows error

**Solutions**:
1. Check that your site uses HTTPS (required for iframes)
2. Verify the embed URL is correct
3. Check browser console for CORS errors
4. Ensure your hosting allows iframe embedding

### Form Too Small/Large

**Issue**: Form doesn't fit properly in the page

**Solutions**:
1. Adjust the height value (recommended: 800-1000px)
2. Set width to 100% for responsive layouts
3. Test on mobile devices and adjust accordingly
4. Use the live preview to test before embedding

### Submission Not Working

**Issue**: Form submits but order doesn't appear

**Solutions**:
1. Check that products are active in inventory
2. Verify at least one sales rep is active
3. Check server logs for errors
4. Test the form directly at `/order-form/embed`

### Styling Issues

**Issue**: Form doesn't match site design

**Solutions**:
1. Remove the default styling from the iframe code
2. Add custom CSS to your site
3. Adjust border-radius, shadows, and colors
4. Consider wrapping the iframe in a styled container

## Best Practices

### Placement
- **Home page**: Above the fold or in hero section
- **Product pages**: Below product details
- **Landing pages**: Center of page as main CTA
- **Sidebar**: Use narrower width (320-400px)

### User Experience
- **Context**: Add a heading above the form explaining what it's for
- **Trust signals**: Display testimonials or guarantees nearby
- **Contact info**: Provide alternative contact methods
- **Loading state**: The form may take 1-2 seconds to load

### Mobile Optimization
- **Responsive width**: Always use 100% width for mobile
- **Height**: 600-800px works best on mobile
- **Testing**: Test on actual mobile devices, not just desktop browsers

### Performance
- **Loading**: Form loads asynchronously, won't slow down your site
- **Caching**: Browsers will cache the iframe for faster repeat loads
- **Size**: Minimal impact on page load time

## Advanced Usage

### Multiple Forms on Same Page
You can embed multiple order forms on the same page:

```html
<!-- Form 1 -->
<div id="form-1">
  <iframe src="https://yourdomain.com/order-form/embed" ...></iframe>
</div>

<!-- Form 2 -->
<div id="form-2">
  <iframe src="https://yourdomain.com/order-form/embed" ...></iframe>
</div>
```

### Conditional Display
Show/hide the form based on conditions:

```javascript
// Show form only for returning visitors
if (localStorage.getItem('visited')) {
  document.getElementById('ordo-order-form').style.display = 'block';
}
```

### Custom Styling Container
Wrap the iframe in a custom container:

```html
<div class="custom-order-form-container">
  <h2>Place Your Order</h2>
  <p>Fill out the form below to get started</p>
  <iframe src="..." ...></iframe>
  <p class="trust-badge">🔒 Secure Order Processing</p>
</div>
```

## Testing Checklist

Before deploying the embed form to production:

- [ ] Test form submission (complete an order)
- [ ] Verify order appears in admin dashboard
- [ ] Check that sales rep receives notification
- [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Chrome Android)
- [ ] Verify form is responsive at different screen sizes
- [ ] Check form loads within 2-3 seconds
- [ ] Test error handling (submit with missing fields)
- [ ] Verify success message displays after submission
- [ ] Check that form styling matches your site

## Support

For issues or questions:
- Check the troubleshooting section above
- Review browser console for error messages
- Test the form directly at `/order-form/embed`
- Contact your development team

## Updates

The embed form automatically receives updates when you deploy new versions of Ordo. No need to update the embed code on your website.

---

**Ready to embed!** Visit the Embed Form page in your admin dashboard to get started.
