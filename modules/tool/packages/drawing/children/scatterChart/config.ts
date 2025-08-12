import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '散点图',
    en: 'Scatter Chart'
  },
  description: {
    'zh-CN': '生成散点图和气泡图，用于展示两个变量之间的关系',
    en: 'Generate scatter plots and bubble charts to show relationships between two variables'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'v2.0 架构：专业工具 + 智能优化',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'title',
          label: '图表标题',
          description: '图表的标题（可选）',
          required: false,
          toolDescription: '图表的标题，留空则不显示标题'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'xAxis',
          label: 'X轴数据',
          description: 'X轴数值数据，例如：[1, 2, 3, 4, 5]',
          required: true,
          toolDescription: 'X轴数值数据，散点图的横坐标值'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'yAxis',
          label: 'Y轴数据',
          description: 'Y轴数值数据，例如：[10, 20, 30, 40, 50]',
          required: true,
          toolDescription: 'Y轴数值数据，散点图的纵坐标值'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'sizeAxis',
          label: '气泡大小数据',
          description: '气泡图的大小数据，例如：[5, 10, 15, 8, 12]',
          required: false,
          toolDescription: '仅气泡图需要，用于控制气泡大小的数值数据'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSubType',
          label: '散点图类型',
          description: '选择散点图的子类型',
          required: false,
          defaultValue: 'scatter',
          list: [
            {
              label: '基础散点图',
              value: 'scatter'
            },
            {
              label: '气泡图',
              value: 'bubble'
            }
          ],
          toolDescription: '散点图类型：scatter(基础), bubble(气泡图)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'autoOptimize',
          label: '智能优化轴线',
          description: '自动检测并优化坐标轴范围显示',
          required: false,
          defaultValue: true,
          toolDescription: '开启后自动检测小范围数据并优化坐标轴显示'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'colorScheme',
          label: '颜色方案',
          description: '选择图表的配色方案',
          required: false,
          defaultValue: 'blue',
          list: [
            {
              label: '蓝色系',
              value: 'blue'
            },
            {
              label: '绿色系',
              value: 'green'
            },
            {
              label: '暖色系',
              value: 'warm'
            },
            {
              label: '冷色系',
              value: 'cool'
            },
            {
              label: '紫色系',
              value: 'purple'
            }
          ],
          toolDescription: '图表配色方案：blue, green, warm, cool, purple'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSize',
          label: '图表尺寸',
          description: '选择图表尺寸',
          required: false,
          defaultValue: 'medium',
          list: [
            {
              label: '小型 (400x300)',
              value: 'small'
            },
            {
              label: '中型 (600x450)',
              value: 'medium'
            },
            {
              label: '大型 (800x600)',
              value: 'large'
            }
          ],
          toolDescription: '图表尺寸：small(400x300), medium(600x450), large(800x600)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'legendPosition',
          label: '图例位置',
          description: '选择图例显示位置',
          required: false,
          defaultValue: 'bottom',
          list: [
            {
              label: '顶部',
              value: 'top'
            },
            {
              label: '右侧',
              value: 'right'
            },
            {
              label: '底部',
              value: 'bottom'
            },
            {
              label: '左侧',
              value: 'left'
            }
          ],
          toolDescription: '图例位置：top, right, bottom, left'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成的散点图URL，可用markdown格式展示：![图片](url)',
          defaultValue: '',
          label: '图表URL',
          key: 'chartUrl'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: 'ECharts配置JSON，用于调试和二次开发',
          defaultValue: '',
          label: 'ECharts配置',
          key: 'echartsConfig'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '智能检测结果和建议',
          defaultValue: '',
          label: '优化建议',
          key: 'optimizationTip'
        }
      ]
    }
  ]
});
