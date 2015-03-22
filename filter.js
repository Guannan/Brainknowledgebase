/*Image filter options*/

// variable storing all relevant parameters for axial filter
var axi_filter = 
{
	brightness_scale:1, 
	contrast_scale:1, 
	hidden_element_id:"axi_dense_image_canvas_Whole_Brain_T1_hr_hidden",
	element_id:"axi_dense_image_canvas_Whole_Brain_T1_hr", 
	base_imgd:false, 
	avg_luminance:0,
	update_brightness: function(){
		if (this.brightness_scale != 1){
			update_brightness(this.brightness_scale, this.element_id);										
		}
	},
	update_contrast: function(){
		if (this.contrast_scale != 1){
			update_contrast(this.contrast_scale,this.element_id, this.avg_luminance);										
		}
	}
}

// variable storing all relevant parameters for sagittal filter
var sag_filter = 
{
	brightness_scale:1, 
	contrast_scale:1, 
	hidden_element_id:"sag_dense_image_canvas_Whole_Brain_T1_hr_hidden",	
	element_id:"sag_dense_image_canvas_Whole_Brain_T1_hr", 
	base_imgd:false,
	avg_luminance:0,
	update_brightness : function(){
		if (this.brightness_scale != 1){
			update_brightness(this.brightness_scale, this.element_id);										
		}
	},
	update_contrast : function(){
		if (this.contrast_scale != 1){
			update_contrast(this.contrast_scale,this.element_id,this.avg_luminance);										
		}
	}
}

// variable storing all relevant parameters for coronal filter
var cor_filter = 
{
	brightness_scale:1, 
	contrast_scale:1, 
	hidden_element_id:"cor_dense_image_canvas_Whole_Brain_T1_hr_hidden",	
	element_id:"cor_dense_image_canvas_Whole_Brain_T1_hr", 
	base_imgd:false,
	avg_luminance:0,
	update_brightness : function(){
		if (this.brightness_scale != 1){
			update_brightness(this.brightness_scale, this.element_id);										
		}
	},
	update_contrast : function(){
		if (this.contrast_scale != 1){
			update_contrast(this.contrast_scale,this.element_id, this.avg_luminance);						
		}
	}
}


// resets all sliders to default value of 1.0
function reset_slider(slider_id) {
	document.getElementById(slider_id).value = 1.0;
	$("#axi_brightness_slider_status").html(String(1.0));
	$("#axi_contrast_slider_status").html(String(1.0));
	$("#sag_brightness_slider_status").html(String(1.0));
	$("#sag_contrast_slider_status").html(String(1.0));
	$("#cor_brightness_slider_status").html(String(1.0));	
	$("#cor_contrast_slider_status").html(String(1.0));
	return;
}

// used at page load to store the starting pixel values for canvas images
function save_original() {
	var axi_canvas = document.getElementById(axi_filter.hidden_element_id);
//	var axi_canvas = document.getElementById(axi_filter.element_id);
	var context = axi_canvas.getContext("2d");
	axi_filter.base_imgd = context.getImageData(0,0,axi_canvas.width,axi_canvas.height);
	axi_filter.avg_luminance = compute_luminance(axi_filter.base_imgd);

	var cor_canvas = document.getElementById(cor_filter.hidden_element_id);
	context = cor_canvas.getContext("2d");
	cor_filter.base_imgd = context.getImageData(0,0,cor_canvas.width,cor_canvas.height);
	cor_filter.avg_luminance = compute_luminance(cor_filter.base_imgd);
	
	var sag_canvas = document.getElementById(sag_filter.hidden_element_id);
	context = sag_canvas.getContext("2d");
	sag_filter.base_imgd = context.getImageData(0,0,sag_canvas.width,sag_canvas.height);
	sag_filter.avg_luminance = compute_luminance(sag_filter.base_imgd);
	
}

// resets all images on canvas to original pixel values
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

// combination of mini-functions for ease of selection
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

function update_contrast(scale_factor, element_id, avg_luminance){
	// console.log(scale_factor)
	// console.log(element_id)
	var canvas = document.getElementById(element_id);
	var context = canvas.getContext("2d");
	var imgd = context.getImageData(0,0,canvas.width,canvas.height);
	var pix = imgd.data;
	contrast(pix,scale_factor,avg_luminance);
	context.putImageData(imgd,0,0);   // TODO how to incorporate this with draw()
	var slider_id = "#" + element_id.substring(0,3) + "_contrast_slider_status";
	$(slider_id).html(String(scale_factor));
}

function update_brightness(scale_factor, element_id){
	console.log('running');
	var canvas = document.getElementById(element_id);
	var context = canvas.getContext("2d");
	/*var imgd = new ImageData(base_imgd.width, base_imgd.height);
	*/
	// jQuery.extend(true, {}, base_imgd);
	var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
/*	imgd.data.set(base_imgd.data);*/
	var pix = imgd.data;
	brighten(pix,scale_factor);	
	context.putImageData(imgd,0,0);  // TODO how to incorporate this with draw()
	var slider_id = "#" + element_id.substring(0,3) + "_brightness_slider_status";									
	$(slider_id).html(String(scale_factor));
}

//switched to while loop to boost speed?
function brighten(pixels, scale_factor) {
//	for (var i = 0, n = pixels.length; i < n; i += 4) {
	var i = pixels.length;
	var v;
	while (i-=4) {
	
		if(pixels[i+2  ] != pixels[i+1  ])
		{
			console.log("");
		}
/**/	
		v = pixels[i  ]*scale_factor;
//		if (pixels[i  ]*scale_factor > 255) {
		if (v > 255) {
			pixels[i  ] = 255; // red
			pixels[i+1] = 255; 
			pixels[i+2] = 255;
//		} else if (pixels[i  ]*scale_factor < 0) {
		} else if (v < 0) {
			pixels[i  ] = 0;
			pixels[i+1] = 0;
			pixels[i+2] = 0;
		} else {
//			pixels[i  ] = pixels[i  ]*scale_factor;
	//		pixels[i+1  ] = pixels[i+1  ]*scale_factor;
		//	pixels[i+2  ] = pixels[i+2  ]*scale_factor;
			pixels[i  ] = v;
			pixels[i+1  ] = v;
			pixels[i+2  ] = v;
		}
/*		v = pixels[i+1  ]*scale_factor;
		if (v > 255) {
			pixels[i+1] = 255; // green
		} else if (v < 0) {
			pixels[i+1] = 0;
		} else {
			pixels[i+1] = v;
		}
		v = pixels[i+2  ]*scale_factor;
		if (v > 255) {
			pixels[i+2] = 255; // blue
		} else if (v < 0) {
			pixels[i+2] = 0;
		} else {
			pixels[i+2] = v;
		}
		*/
		// i+3 is alpha (the fourth element)
		if (i<=0)
			break;
	}	
}

function compute_luminance(pixels) {
	var avg_luminance = 0;
	var length = pixels.width * pixels.height;
	var total_pixels = length/4;
	for (var i = 0, n = length; i < n; i += 4) {
		var red = pixels.data[i  ];
		var green = pixels.data[i+1];
		var blue = pixels.data[i+2];
		avg_luminance += (0.30*red+0.59*green+0.11*blue)/total_pixels;
	}
	return avg_luminance;
}

// temp replacement for buggy code,
// added the argument for average luminance
function contrast(pixels, scale_factor, avg_luminance) {
	avg_luminance = compute_luminance(pixels);
	
	console.log(avg_luminance)
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
