/*Image filter options*/

var axi_filter = 
{
	brightness_scale:1, 
	contrast_scale:1, 
	element_id:"axi_dense_image_canvas_Whole_Brain_T1_hr", 
	base_imgd:false, 
	update_brightness: function(){
		if (this.brightness_scale != 1){
			update_brightness(this.brightness_scale,this.element_id);										
		}
	},
	update_contrast: function(){
		if (this.contrast_scale != 1){
			update_contrast(this.contrast_scale,this.element_id);										
		}
	}
}
var sag_filter = 
{
	brightness_scale:1, 
	contrast_scale:1, 
	element_id:"sag_dense_image_canvas_Whole_Brain_T1_hr", 
	base_imgd:false,
	update_brightness : function(){
		if (this.brightness_scale != 1){
			update_brightness(this.brightness_scale,this.element_id);										
		}
	},
	update_contrast : function(){
		if (this.contrast_scale != 1){
			update_contrast(this.contrast_scale,this.element_id);										
		}
	}
}
var cor_filter = 
{
	brightness_scale:1, 
	contrast_scale:1, 
	element_id:"cor_dense_image_canvas_Whole_Brain_T1_hr", 
	base_imgd:false,
	update_brightness : function(){
		if (this.brightness_scale != 1){
			update_brightness(this.brightness_scale,this.element_id);										
		}
	},
	update_contrast : function(){
		if (this.contrast_scale != 1){
			update_contrast(this.contrast_scale,this.element_id);										
		}
	}
}

function reset_slider(slider_id) {
	document.getElementById(slider_id).value = 1.0;
	return;
}

function save_original() {
	var axi_canvas = document.getElementById(axi_filter.element_id);
	var context = axi_canvas.getContext("2d");
	axi_filter.base_imgd = context.getImageData(0,0,axi_canvas.width,axi_canvas.height);
	
	var cor_canvas = document.getElementById(cor_filter.element_id);
	context = cor_canvas.getContext("2d");
	cor_filter.base_imgd = context.getImageData(0,0,cor_canvas.width,cor_canvas.height);
	
	var sag_canvas = document.getElementById(sag_filter.element_id);
	context = sag_canvas.getContext("2d");
	sag_filter.base_imgd = context.getImageData(0,0,sag_canvas.width,sag_canvas.height);
	
}

function reset_canvas(element_id){
	var canvas = document.getElementById(element_id);
	var context = canvas.getContext("2d");
	if (element_id.substring(0,3) == "axi" && axi_filter.base_imgd){
		context.putImageData(axi_filter.base_imgd,0,0);
	}
	else if (element_id.substring(0,3) == "cor" && cor_filter.base_imgd){
		context.putImageData(cor_filter.base_imgd,0,0);
	}
	else if (element_id.substring(0,3) == "sag" && sag_filter.base_imgd){
		context.putImageData(sag_filter.base_imgd,0,0);
	} 
	else 
	{
		return;
	}
}

function update_filter_setting(scale_factor,filter_name,element_id){
	reset_canvas(element_id);
	if (element_id.substring(0,3) == "axi" && axi_filter.base_imgd){
		if (filter_name == "brightness"){
			axi_filter.brightness_scale = scale_factor;
		}
		else if (filter_name == "contrast"){
			axi_filter.contrast_scale = scale_factor;
		}
		axi_filter.update_contrast();										
		axi_filter.update_brightness();										
	}
	else if (element_id.substring(0,3) == "cor" && cor_filter.base_imgd){
		if (filter_name == "brightness"){
			cor_filter.brightness_scale = scale_factor;
		}
		else if (filter_name == "contrast"){
			cor_filter.contrast_scale = scale_factor;
		}
		cor_filter.update_contrast();									
		cor_filter.update_brightness();
	}
	else if (element_id.substring(0,3) == "sag" && sag_filter.base_imgd){
		if (filter_name == "brightness"){
			sag_filter.brightness_scale = scale_factor;
		}
		else if (filter_name == "contrast"){
			sag_filter.contrast_scale = scale_factor;
		}
		sag_filter.update_contrast();
		sag_filter.update_brightness();
	}
	else 
	{
		return;
	}
}

function update_contrast(scale_factor, element_id){
	//reset_canvas(element_id);
	var canvas = document.getElementById(element_id);
	var context = canvas.getContext("2d");
	var imgd = context.getImageData(0,0,canvas.width,canvas.height);
	var pix = imgd.data;
	contrast(pix,scale_factor);
	context.putImageData(imgd,0,0);
	var slider_id = "#" + element_id.substring(0,3) + "_contrast_slider_status";
	$(slider_id).html(String(scale_factor));
}

function update_brightness(scale_factor, element_id){
	//reset_canvas(element_id);
	var canvas = document.getElementById(element_id);
	var context = canvas.getContext("2d");
	var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
	var pix = imgd.data;
	brighten(pix,scale_factor);	
	context.putImageData(imgd,0,0);
	var slider_id = "#" + element_id.substring(0,3) + "_brightness_slider_status";									
	$(slider_id).html(String(scale_factor));			
}
								
function invert(pixels) {
	// Loop over each pixel and invert the color.
	for (var i = 0, n = pixels.length; i < n; i += 4) {
		pixels[i  ] = 255 - pixels[i  ]; // red
		pixels[i+1] = 255 - pixels[i+1]; // green
		pixels[i+2] = 255 - pixels[i+2]; // blue
		// i+3 is alpha (the fourth element)
	}
}

//scale_factor goes from 0 to 3
function brighten(pixels, scale_factor) {
	for (var i = 0, n = pixels.length; i < n; i += 4) {
		if (pixels[i  ]*scale_factor > 255) {
			pixels[i  ] = 255; // red
		} else if (pixels[i  ]*scale_factor < 0) {
			pixels[i  ] = 0;
		} else {
			pixels[i  ] = pixels[i  ]*scale_factor;
		}
		
		if (pixels[i+1]*scale_factor > 255) {
			pixels[i+1] = 255; // green
		} else if (pixels[i+1]*scale_factor < 0) {
			pixels[i+1] = 0;
		} else {
			pixels[i+1] = pixels[i+1]*scale_factor;
		}
		
		if (pixels[i+2]*scale_factor > 255) {
			pixels[i+2] = 255; // blue
		} else if (pixels[i+2]*scale_factor < 0) {
			pixels[i+2] = 0;
		} else {
			pixels[i+2] = pixels[i+2]*scale_factor;
		}
		// i+3 is alpha (the fourth element)
	}	
}

function compute_luminance(red, green, blue) {
	return 0.30*red+0.59*green+0.11*blue;
}

// scale_factor goes from 0 to 4?
function contrast(pixels, scale_factor) {
	var avg_luminance = 0;
	var total_pixels = pixels.length/4;
	for (var i = 0, n = pixels.length; i < n; i += 4) {
		var red = pixels[i  ];
		var green = pixels[i+1];
		var blue = pixels[i+2];
		avg_luminance += compute_luminance(red, green, blue)/total_pixels;
	}
	
	for (var i = 0, n = pixels.length; i < n; i += 4) {
		if ((pixels[i  ]-avg_luminance)*scale_factor+avg_luminance > 255) {
			pixels[i  ] = 255; // red
		} else if ((pixels[i  ]-avg_luminance)*scale_factor+avg_luminance < 0) {
			pixels[i  ] = 0;
		} else {
			pixels[i  ] = (pixels[i  ]-avg_luminance)*scale_factor+avg_luminance;
		}
		
		if ((pixels[i+1]-avg_luminance)*scale_factor+avg_luminance > 255) {
			pixels[i+1] = 255; // green
		} else if ((pixels[i+1]-avg_luminance)*scale_factor+avg_luminance < 0) {
			pixels[i+1] = 0;
		} else {
			pixels[i+1] = (pixels[i+1]-avg_luminance)*scale_factor+avg_luminance;
		}
		
		if ((pixels[i+2]-avg_luminance)*scale_factor+avg_luminance > 255) {
			pixels[i+2] = 255; // blue
		} else if ((pixels[i+2]-avg_luminance)*scale_factor+avg_luminance < 0) {
			pixels[i+2] = 0;
		} else {
			pixels[i+2] = (pixels[i+2]-avg_luminance)*scale_factor+avg_luminance;
		}
		// i+3 is alpha (the fourth element)
	}	
}